import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node } from 'ng-diagram';

// Single ELK instance reused across all layout calls.
const elk = new ELK();

/**
 * Cached maximum node dimensions across all layout runs. Only grows —
 * never shrinks — so that layout spacing stays stable when zoom-driven
 * template variants (full vs compact) produce different sizes.
 */
let cachedMaxWidth = 0;
let cachedMaxHeight = 0;

function getUniformNodeSize(nodes: Node[]): { width: number; height: number } {
  for (const node of nodes) {
    const w = node.measuredBounds?.width ?? node.size?.width ?? 0;
    const h = node.measuredBounds?.height ?? node.size?.height ?? 0;
    if (w > cachedMaxWidth) cachedMaxWidth = w;
    if (h > cachedMaxHeight) cachedMaxHeight = h;
  }
  return { width: cachedMaxWidth, height: cachedMaxHeight };
}

/**
 * Compute tree positions for the given nodes using ELK.js.
 *
 * Converts ng-diagram nodes/edges into the ELK graph format, runs the
 * layout algorithm, and returns a new array of nodes with updated
 * positions.
 */
export async function performLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'DOWN' | 'RIGHT' = 'DOWN',
  nodeSpacing = 140,
) {
  const layoutOptions = {
    'elk.algorithm': 'mrtree',
    'elk.direction': direction,
    'elk.mrtree.edgeRoutingMode': 'MIDDLE_TO_MIDDLE',
    'spacing.nodeNode': String(nodeSpacing),
  };

  const { width, height } = getUniformNodeSize(nodes);

  const nodesToLayout = nodes.map(
    (node): ElkNode => ({
      id: node.id,
      width,
      height,
    }),
  );

  // Build the ELK graph with nodes as children and edges as connections.
  const graph: ElkNode = {
    id: 'root-graph',
    layoutOptions,
    children: nodesToLayout,
    edges: edges.map(({ id, source, target }) => {
      return {
        id,
        sources: [source],
        targets: [target],
      };
    }),
  };

  const { children: laidOutNodes } = await elk.layout(graph);

  const laidOutNodesMap = new Map(laidOutNodes?.map((node) => [node.id, node]));

  const isHorizontal = direction === 'RIGHT';

  return nodes.map((node) => {
    const laidOut = laidOutNodesMap.get(node.id);
    if (laidOut?.x === undefined || laidOut?.y === undefined) {
      return { ...node, position: node.position };
    }

    // ELK lays every node out as a uniform `width` x `height` cell (see
    // `getUniformNodeSize`) so spacing stays stable across auto-sized cards
    // of varying content width. Cards render at their own real width
    // (`min-width`, not a fixed `width`), so aligning a node's top-left
    // corner to its cell's top-left leaves narrower/wider cards off-center
    // within the cell — parent-child connectors then jog sideways instead
    // of running straight whenever adjacent cards have different
    // content-driven widths.
    //
    // Only compensate along the *cross* axis (perpendicular to the tree's
    // growth direction): that's the axis ELK uses to spread siblings apart
    // and center a single child under its parent, so it's the one whose
    // cell-relative center must match each card's real center. The *flow*
    // axis (the one generations stack along) must stay top/left-aligned to
    // the raw cell instead — every card in the same generation shares that
    // coordinate, and centering it too would stagger cards of different
    // heights within a row and break the shared row alignment fan-out
    // connectors rely on.
    const realWidth = node.measuredBounds?.width ?? node.size?.width ?? width;
    const realHeight = node.measuredBounds?.height ?? node.size?.height ?? height;

    return {
      ...node,
      position: isHorizontal
        ? { x: laidOut.x, y: laidOut.y + (height - realHeight) / 2 }
        : { x: laidOut.x + (width - realWidth) / 2, y: laidOut.y },
    };
  });
}
