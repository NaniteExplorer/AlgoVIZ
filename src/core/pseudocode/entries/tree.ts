import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the tree family. */
export const TREE_PSEUDOCODE: Record<string, Pseudocode> = {
  'bst-search': {
    lines: [
      /* 0 */ 'procedure bstSearch(root, target)',
      /* 1 */ '  node ← root',
      /* 2 */ '  while node ≠ null do',
      /* 3 */ '    if target = node.value then return node',
      /* 4 */ '    if target < node.value then',
      /* 5 */ '      node ← node.left',
      /* 6 */ '    else',
      /* 7 */ '      node ← node.right',
      /* 8 */ '  return NOT_FOUND',
    ],
  },

  'bst-insert': {
    lines: [
      /* 0 */ 'procedure bstInsert(root, key)',
      /* 1 */ '  if root = null then return newNode(key)',
      /* 2 */ '  node ← root',
      /* 3 */ '  loop',
      /* 4 */ '    if key < node.value then',
      /* 5 */ '      if node.left = null then node.left ← newNode(key); return',
      /* 6 */ '      node ← node.left',
      /* 7 */ '    else',
      /* 8 */ '      if node.right = null then node.right ← newNode(key); return',
      /* 9 */ '      node ← node.right',
    ],
  },

  inorder: {
    lines: [
      /* 0 */ 'procedure inorder(node)',
      /* 1 */ '  if node = null then return',
      /* 2 */ '  inorder(node.left)',
      /* 3 */ '  visit(node)          // yields sorted order in a BST',
      /* 4 */ '  inorder(node.right)',
    ],
  },

  preorder: {
    lines: [
      /* 0 */ 'procedure preorder(node)',
      /* 1 */ '  if node = null then return',
      /* 2 */ '  visit(node)          // root before subtrees',
      /* 3 */ '  preorder(node.left)',
      /* 4 */ '  preorder(node.right)',
    ],
  },

  postorder: {
    lines: [
      /* 0 */ 'procedure postorder(node)',
      /* 1 */ '  if node = null then return',
      /* 2 */ '  postorder(node.left)',
      /* 3 */ '  postorder(node.right)',
      /* 4 */ '  visit(node)          // subtrees before root',
    ],
  },
};
