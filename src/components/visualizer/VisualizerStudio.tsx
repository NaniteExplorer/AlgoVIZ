'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { algorithmHref } from '@/catalog';
import type { AlgorithmCategory } from '@/core/algorithms';
import { useVisualizer } from '@/hooks/useVisualizer';
import { useLesson } from '@/hooks/useLesson';
import { LessonPanel } from '@/components/learn/LessonPanel';
import { BottomSheet, type SheetSnap } from '@/components/ui/Sheet';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { InsightsPanel } from '@/components/studio/InsightsPanel';
import { PseudocodePane } from '@/components/studio/PseudocodePane';
import { StageFrame } from '@/components/studio/StageFrame';
import { AlgorithmSelector } from './AlgorithmSelector';
import { ComplexityCard } from './ComplexityCard';
import { ControlPanel, Scrubber, Transport } from './ControlPanel';
import { Legend } from './Legend';
import { VisualizerCanvas } from './VisualizerCanvas';

interface Props {
  category: AlgorithmCategory;
  /** Route slug for the algorithm being shown. */
  slug: string;
}

/**
 * The interactive studio.
 *
 * Layout by breakpoint:
 * - **2xl** — three panes: pseudocode | stage | controls.
 * - **xl**  — two panes; pseudocode folds into the tab strip under the stage.
 * - **md/lg** — one column; stage on top, everything else in tabs.
 * - **<md** — the stage sticks under the top bar, a compact transport strip
 *   sits beneath it, and the full control panel lives in a draggable sheet.
 *
 * There is exactly one `ControlPanel` instance behind all of these: the layout
 * changes, the controls don't.
 */
export function VisualizerStudio({ category, slug }: Props) {
  const router = useRouter();
  const {
    containerRef,
    snapshot,
    algorithms,
    algorithmId,
    currentMeta,
    pseudocode,
    params,
    controls,
    metricSpecs,
    legend,
    series,
    backendKind,
    setInteractive,
    actions,
  } = useVisualizer(category, { initialAlgorithmId: slug });

  const accent = currentMeta?.accent ?? '#22d3ee';
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [tabId, setTabId] = useState('controls');

  // Selecting a sibling is a navigation, not local state: the URL is the source
  // of truth, and the hook picks the change up from the slug prop.
  const selectAlgorithm = useCallback(
    (id: string) => router.push(algorithmHref({ category, slug: id })),
    [router, category],
  );

  useKeyboardTransport(actions);

  // The lesson pauses playback when it reaches an unanswered checkpoint.
  const lessonState = useLesson(algorithmId, snapshot, series, actions.pause);

  const codePane = useMemo(
    () =>
      pseudocode ? (
        <PseudocodePane
          code={pseudocode}
          activeLine={snapshot.line}
          spotlight={lessonState.highlightLines}
          playing={snapshot.status === 'playing'}
          className="h-full"
        />
      ) : null,
    [pseudocode, snapshot.line, snapshot.status, lessonState.highlightLines],
  );

  const controlPanel = useMemo(
    () => (
      <ControlPanel
        snapshot={snapshot}
        controls={controls}
        params={params}
        accent={accent}
        actions={actions}
      />
    ),
    [snapshot, controls, params, accent, actions],
  );

  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [
      { id: 'controls', label: 'Controls', content: <div className="pb-2">{controlPanel}</div> },
    ];
    if (codePane) {
      items.push({ id: 'code', label: 'Pseudocode', content: <div className="h-72">{codePane}</div> });
    }
    if (lessonState.lesson || lessonState.loading) {
      items.push({ id: 'lesson', label: 'Lesson', content: <LessonPanel state={lessonState} /> });
    }
    if (currentMeta) {
      items.push({
        id: 'insights',
        label: 'Analysis',
        content: (
          <InsightsPanel
            category={category}
            meta={currentMeta}
            snapshot={snapshot}
            series={series}
            metricSpecs={metricSpecs}
            controls={controls}
            accent={accent}
          />
        ),
      });
    }
    items.push({ id: 'legend', label: 'Legend', content: <Legend items={legend} /> });
    if (currentMeta) {
      items.push({ id: 'about', label: 'About', content: <ComplexityCard meta={currentMeta} /> });
    }
    return items;
  }, [
    controlPanel,
    codePane,
    legend,
    currentMeta,
    category,
    snapshot,
    series,
    metricSpecs,
    controls,
    accent,
    lessonState,
  ]);

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Pseudocode column — 2xl only; folded into the tabs below that. */}
        <aside className="hidden 2xl:block">
          <div className="sticky top-16 h-[min(70dvh,640px)]">{codePane ?? <NoPseudocode />}</div>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <AlgorithmSelector
            algorithms={algorithms}
            activeId={algorithmId}
            onSelect={selectAlgorithm}
          />

          {/* Sticking the stage below the top bar keeps the visualization on
              screen while the sheet and tabs scroll underneath it. */}
          <div className="sticky top-12 z-10 -mx-3 bg-surface-950 px-3 pb-2 pt-1 md:static md:mx-0 md:bg-transparent md:p-0">
            <StageFrame
              containerRef={containerRef}
              onInteractiveChange={setInteractive}
              needsWebGL={backendKind === 'webgl'}
            >
              <VisualizerCanvas snapshot={snapshot} metricSpecs={metricSpecs} accent={accent} />
            </StageFrame>
          </div>

          {/* Compact transport for phones: the sheet may be collapsed, but
              play/pause must always be one tap away. */}
          <div className="flex items-center gap-3 md:hidden">
            <Transport snapshot={snapshot} accent={accent} actions={actions} compact />
            <Scrubber
              snapshot={snapshot}
              accent={accent}
              onSeek={actions.seek}
              className="min-w-0 flex-1"
            />
          </div>

          <div className="hidden md:block 2xl:hidden">
            <Tabs items={tabs} activeId={tabId} onChange={setTabId} />
          </div>

          <div className="hidden 2xl:block">
            <Legend items={legend} />
          </div>
        </div>

        {/* Controls column — xl and up. */}
        <aside className="hidden flex-col gap-4 xl:flex">
          <div className="panel p-4">{controlPanel}</div>
          {currentMeta ? <ComplexityCard meta={currentMeta} /> : null}
          {/* At 2xl the tab strip is gone (pseudocode has its own column), so
              the analysis charts move into this rail instead. */}
          {currentMeta ? (
            <div className="panel hidden p-4 2xl:block">
              <InsightsPanel
                category={category}
                meta={currentMeta}
                snapshot={snapshot}
                series={series}
                metricSpecs={metricSpecs}
                controls={controls}
                accent={accent}
              />
            </div>
          ) : null}
        </aside>
      </div>

      {/* Mobile: the same control panel, in a draggable sheet. */}
      <div className="md:hidden">
        <BottomSheet snap={sheetSnap} onSnapChange={setSheetSnap} title="Controls & details">
          <Tabs items={tabs} activeId={tabId} onChange={setTabId} />
        </BottomSheet>
        {/* Reserve room so the sheet's peek state never covers page content. */}
        <div aria-hidden className="h-24" />
      </div>
    </div>
  );
}

function NoPseudocode() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line px-6 text-center text-xs text-content-muted">
      Pseudocode for this algorithm hasn’t been written yet.
    </div>
  );
}

/**
 * Space toggles playback, arrows single-step, Home/End jump to the ends.
 *
 * Skipped while a form control has focus so it never fights the sliders, and
 * skipped during IME composition so it never eats a keystroke mid-word.
 */
function useKeyboardTransport(actions: ReturnType<typeof useVisualizer>['actions']) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // A dialog or sheet owns the keyboard while it's open.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.toggle();
          break;
        case 'ArrowRight':
        case '.':
          e.preventDefault();
          actions.stepForward();
          break;
        case 'ArrowLeft':
        case ',':
          e.preventDefault();
          actions.stepBackward();
          break;
        case 'Home':
          e.preventDefault();
          actions.seek(-1);
          break;
        case 'End':
          e.preventDefault();
          actions.seek(Number.MAX_SAFE_INTEGER);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);
}
