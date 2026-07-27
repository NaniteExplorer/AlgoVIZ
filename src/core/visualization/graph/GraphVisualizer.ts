import * as THREE from 'three';
import { Visualizer } from '../Visualizer';
import type { FrameContext, VisualizationEngine } from '../engine/VisualizationEngine';
import { GraphModel } from '@/core/model/GraphModel';
import { SCENE } from '@/theme';
import { GlowNode } from '../primitives/GlowNode';
import { GlowEdge } from '../primitives/GlowEdge';
import { DSU_EDGE_STYLE, GRAPH_EDGE_STYLES, GRAPH_NODE_STYLES, groupColor } from './palette';

interface EdgeView {
  u: number;
  v: number;
  edge: GlowEdge;
}

/**
 * Renders a {@link GraphModel} as a glowing 3D node-link network: nodes are
 * labelled spheres, edges are thin emissive cylinders carrying their weight.
 *
 * A pure pull renderer — each frame it reads every node/edge role from the model
 * and eases its colour, glow and scale toward the matching style. The frontier
 * fans out in cyan, the current node swells amber, settled nodes cool to indigo,
 * and the final shortest path ignites in gold.
 */
export class GraphVisualizer extends Visualizer {
  private static readonly NODE_RADIUS = 1.1;
  private static readonly EDGE_RADIUS = 0.13;

  private nodeViews: GlowNode[] = [];
  private edgeViews: EdgeView[] = [];
  /**
   * Reusable edges for the disjoint-set forest.
   *
   * Pooled at `nodeCount` because a DSU forest has at most one parent pointer
   * per node. Allocating and disposing Three.js geometry every time a union
   * happens would thrash the GPU during a Kruskal run.
   */
  private dsuPool: GlowEdge[] = [];
  private positions: THREE.Vector3[] = [];

  constructor(private readonly model: GraphModel) {
    super();
  }

  protected onAttach(_engine: VisualizationEngine): void {
    void _engine;
    this.buildEnvironment();
    this.rebuild();
  }

  protected onFrame(ctx: FrameContext): void {
    for (let i = 0; i < this.nodeViews.length; i += 1) {
      const style = GRAPH_NODE_STYLES[this.model.nodeRole(i)];
      // A component assignment overrides the role colour: once Union–Find or
      // Tarjan has coloured a node, which component it landed in is the
      // information that matters, not whether it was recently visited.
      const group = this.model.groupFor(i);
      const color = group === undefined ? style.color : groupColor(group);
      this.nodeViews[i].setTargetStyle(color, style.emissive, style.scale);
      this.nodeViews[i].update(ctx.dt);
    }

    for (const { u, v, edge } of this.edgeViews) {
      const style = GRAPH_EDGE_STYLES[this.model.edgeRole(u, v)];
      edge.setTargetStyle(style.color, style.emissive, style.opacity);
      edge.update(ctx.dt);
    }

    this.syncDsuEdges(ctx.dt);
  }

  protected onDispose(): void {
    this.nodeViews.forEach((n) => n.dispose());
    this.edgeViews.forEach((e) => e.edge.dispose());
    this.dsuPool.forEach((e) => e.dispose());
    this.nodeViews = [];
    this.edgeViews = [];
    this.dsuPool = [];
    this.positions = [];
  }

  /**
   * Re-aim the pooled edges at the model's current disjoint-set forest.
   *
   * The forest changes shape on nearly every union, so these are repositioned
   * each frame rather than rebuilt; unused slots are hidden, not disposed.
   */
  private syncDsuEdges(dt: number): void {
    const dynamic = this.model.dynamicEdges;
    for (let i = 0; i < this.dsuPool.length; i += 1) {
      const edge = this.dsuPool[i];
      const link = dynamic[i];
      if (!link || !this.positions[link.u] || !this.positions[link.v]) {
        edge.setVisible(false);
        continue;
      }
      edge.setVisible(true);
      edge.setEndpoints(this.positions[link.u], this.positions[link.v]);
      edge.setTargetStyle(DSU_EDGE_STYLE.color, DSU_EDGE_STYLE.emissive, DSU_EDGE_STYLE.opacity);
      edge.update(dt);
    }
  }

  rebuild(): void {
    this.nodeViews.forEach((n) => {
      this.group.remove(n.group);
      n.dispose();
    });
    this.edgeViews.forEach((e) => {
      this.group.remove(e.edge.group);
      e.edge.dispose();
    });
    this.dsuPool.forEach((e) => {
      this.group.remove(e.group);
      e.dispose();
    });
    this.nodeViews = [];
    this.edgeViews = [];
    this.dsuPool = [];

    const { NODE_RADIUS, EDGE_RADIUS } = GraphVisualizer;
    const positions = this.model.nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z));
    this.positions = positions;

    // Edges first so they sit visually behind the node orbs.
    for (const { u, v, w } of this.model.edges) {
      const edge = new GlowEdge(positions[u], positions[v], EDGE_RADIUS, w);
      this.edgeViews.push({ u, v, edge });
      this.group.add(edge.group);
    }

    for (const node of this.model.nodes) {
      const view = new GlowNode(positions[node.id], NODE_RADIUS, String(node.id));
      this.nodeViews.push(view);
      this.group.add(view.group);
    }

    // One pooled edge per node: a disjoint-set forest has at most one parent
    // pointer per element, so this is an exact upper bound.
    if (positions.length >= 2) {
      for (let i = 0; i < positions.length; i += 1) {
        const edge = new GlowEdge(positions[0], positions[1], EDGE_RADIUS * 1.6);
        edge.setVisible(false);
        this.dsuPool.push(edge);
        this.group.add(edge.group);
      }
    }
  }

  /** Faint floor grid that grounds the network and catches the bloom glow. */
  private buildEnvironment(): void {
    const grid = new THREE.GridHelper(220, 44, SCENE.grid, SCENE.grid);
    grid.position.y = -10;
    (grid.material as THREE.Material).opacity = 0.18;
    (grid.material as THREE.Material).transparent = true;
    this.registerEnvironment(null, grid);
    this.group.add(grid);
  }
}
