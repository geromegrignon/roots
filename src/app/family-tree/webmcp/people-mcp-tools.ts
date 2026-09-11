import { declareExperimentalWebMcpTool, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type Node,
  type Rect,
} from 'ng-diagram';
import { AddNodeService } from '../diagram/model/add-node.service';
import { getIsCollapsed } from '../diagram/model/data-getters';
import { ExpandCollapseService } from '../diagram/model/expand-collapse.service';
import { isOccupiedNode } from '../diagram/model/guards';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import {
  formatFullName,
  type FamilyTreeBaseNodeData,
  type FamilyTreeNodeData,
  type FamilyTreeOccupiedNodeData,
  type Gender,
} from '../diagram/model/interfaces';
import { LayoutService, type LayoutDirection } from '../diagram/layout/layout.service';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { ModelChanges } from '../diagram/model/model-changes';
import { SortOrderService } from '../diagram/model/sort-order.service';
import { isCommunityCvSubject } from '../properties-sidebar/community-cv/community-cv-match';
import { NodeMutationService } from '../properties-sidebar/node-mutation.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import {
  EMPTY_FORM,
  formDataToNodeData,
  nodeDataToFormData,
  type SidebarFormData,
} from '../properties-sidebar/components/sidebar-form/sidebar-form.mappers';

/** The two `Gender` enum values, spelled out for a WebMCP JSON Schema `enum`. */
const GENDER_ENUM = ['female', 'male'] as const;

/** The two `LayoutDirection` values, spelled out for a WebMCP JSON Schema `enum`. */
const LAYOUT_DIRECTION_ENUM = ['DOWN', 'RIGHT'] as const;

/** Plain-object shape returned to the agent for one person. */
interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: Gender | null;
  birthYear: number | null;
  deathYear: number | null;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  spouseGender: Gender | null;
  spouseBirthYear: number | null;
  spouseDeathYear: number | null;
  /** Id of the person this node hangs off of in the tree, or `null` for a root. */
  parentId: string | null;
  /** Only included by `get_person` — omitted from `list_people` to keep listings compact. */
  childIds?: string[];
}

function toPersonSummary(
  id: string,
  data: FamilyTreeOccupiedNodeData,
  parentId: string | null,
  childIds?: string[],
): PersonSummary {
  return {
    id,
    firstName: data.firstName,
    lastName: data.lastName ?? null,
    gender: data.gender ?? null,
    birthYear: data.birthYear ?? null,
    deathYear: data.deathYear ?? null,
    spouseFirstName: data.spouseFirstName ?? null,
    spouseLastName: data.spouseLastName ?? null,
    spouseGender: data.spouseGender ?? null,
    spouseBirthYear: data.spouseBirthYear ?? null,
    spouseDeathYear: data.spouseDeathYear ?? null,
    parentId,
    ...(childIds ? { childIds } : {}),
  };
}

function matchesQuery(data: FamilyTreeOccupiedNodeData, needle: string): boolean {
  return [data.firstName, data.lastName, data.spouseFirstName, data.spouseLastName]
    .filter((part): part is string => !!part)
    .some((part) => part.toLowerCase().includes(needle));
}

/** The person-related fields a WebMCP tool input may carry (a subset of `SidebarFormData`). */
interface PersonFieldsInput {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthYear?: number;
  deathYear?: number;
  spouseFirstName?: string;
  spouseLastName?: string;
  spouseGender?: string;
  spouseBirthYear?: number;
  spouseDeathYear?: number;
}

/**
 * Overlays the provided (non-undefined) fields from a WebMCP tool input onto a base
 * `SidebarFormData`, leaving every omitted field untouched. Used for both creating a person
 * (base = `EMPTY_FORM`) and updating one (base = that person's current form data).
 */
function applyPersonFieldsToFormData(
  base: SidebarFormData,
  input: PersonFieldsInput,
): SidebarFormData {
  const merged: SidebarFormData = { ...base };
  if (input.firstName !== undefined) merged.firstName = input.firstName;
  if (input.lastName !== undefined) merged.lastName = input.lastName;
  if (input.gender !== undefined) merged.gender = input.gender as SidebarFormData['gender'];
  if (input.birthYear !== undefined) merged.birthYear = input.birthYear;
  if (input.deathYear !== undefined) merged.deathYear = input.deathYear;
  if (input.spouseFirstName !== undefined) merged.spouseFirstName = input.spouseFirstName;
  if (input.spouseLastName !== undefined) merged.spouseLastName = input.spouseLastName;
  if (input.spouseGender !== undefined)
    merged.spouseGender = input.spouseGender as SidebarFormData['spouseGender'];
  if (input.spouseBirthYear !== undefined) merged.spouseBirthYear = input.spouseBirthYear;
  if (input.spouseDeathYear !== undefined) merged.spouseDeathYear = input.spouseDeathYear;
  return merged;
}

function childIdsOf(modelService: NgDiagramModelService, id: string): string[] {
  return modelService
    .getConnectedEdges(id)
    .filter((edge) => edge.source === id)
    .map((edge) => edge.target);
}

/** Walks every descendant of `rootId` (any depth), regardless of alive status. */
function collectAllDescendantIds(modelService: NgDiagramModelService, rootId: string): string[] {
  const ids: string[] = [];
  const queue = childIdsOf(modelService, rootId);

  while (queue.length > 0) {
    const id = queue.shift()!;
    ids.push(id);
    queue.push(...childIdsOf(modelService, id));
  }

  return ids;
}

/**
 * Unions the `measuredBounds` of a set of nodes, mirroring ng-diagram's own node-bounds
 * calculation but *without* folding in any edges. Returns `null` if none of the nodes have
 * been measured yet.
 *
 * This exists to work around a quirk in `NgDiagramViewportService.zoomToFit`: its bounds
 * calculation unconditionally unions in an edge-bounds rect, and when there are no edges to
 * fit that rect comes back as `{ x: 0, y: 0, width: 0, height: 0 }` — a zero-size box sitting
 * at the diagram's origin — which drags the overall fit out to include the origin instead of
 * fitting tightly around the given nodes. There's also no way to ask `zoomToFit` for "no
 * edges" from the outside: passing `edgeIds: []` is treated the same as omitting it entirely
 * (i.e. "fit ALL edges in the diagram"), since the library only applies an edge filter when
 * the array is non-empty. Both make `zoomToFit({ nodeIds, edgeIds: [] })` unusable for a
 * person with no descendants (nothing to connect an edge to within the focus set), which is
 * exactly the case `zoomToFitNodesOnly` below is for.
 */
function computeNodesBounds(
  modelService: NgDiagramModelService,
  nodeIds: Iterable<string>,
): Rect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of nodeIds) {
    const bounds = modelService.getNodeById(id)?.measuredBounds;
    if (!bounds) continue;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Pans/zooms the viewport to fit a set of nodes with no edges involved, working around the
 * `zoomToFit` limitation described on {@link computeNodesBounds}. Mirrors `zoomToFit`'s own
 * padding/scale/centering behavior (default 50px padding, scale clamped to the diagram's
 * configured min/max zoom, centered on the bounds) but computes bounds from node geometry
 * alone. A no-op if the nodes haven't been measured yet or the viewport has no usable size.
 */
async function zoomToFitNodesOnly(
  modelService: NgDiagramModelService,
  viewportService: NgDiagramViewportService,
  nodeIds: Iterable<string>,
): Promise<void> {
  const bounds = computeNodesBounds(modelService, nodeIds);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

  const viewport = viewportService.viewport();
  const viewportWidth = viewport.width ?? 0;
  const viewportHeight = viewport.height ?? 0;
  const padding = 50;
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;
  if (availableWidth <= 0 || availableHeight <= 0) return;

  const rawScale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
  const scale = Math.max(viewportService.minZoom, Math.min(viewportService.maxZoom, rawScale));
  if (!isFinite(scale) || scale <= 0) return;

  const x = viewportWidth / 2 - (bounds.x + bounds.width / 2) * scale;
  const y = viewportHeight / 2 - (bounds.y + bounds.height / 2) * scale;
  await viewportService.setViewport(x, y, scale);
}

/**
 * One descendant returned by `get_alive_descendants`, extending the usual
 * person fields with the genealogical context succession planning needs:
 * how many generations below the ancestor they are, and which of the
 * ancestor's direct children they descend from (their branch, or 'stirps').
 */
interface AliveDescendant extends PersonSummary {
  generation: number;
  rootChildId: string;
}

/**
 * Walks the tree below `rootId` for the *nearest* living descendant along
 * each branch — i.e. the heir under representation. As soon as a branch
 * reaches a living, filled-in person, that person is included and the
 * branch stops there: their own children are not explored, since the
 * living person is the one who inherits on that line, not their children.
 * A deceased person or an unfilled-in (vacant) placeholder isn't a stopping
 * point — traversal passes through them to keep looking further down that
 * same line for its nearest living descendant(s).
 */
function collectNearestAliveDescendants(
  modelService: NgDiagramModelService,
  rootId: string,
): { node: Node<FamilyTreeOccupiedNodeData>; generation: number; rootChildId: string }[] {
  const results: {
    node: Node<FamilyTreeOccupiedNodeData>;
    generation: number;
    rootChildId: string;
  }[] = [];
  const queue: { id: string; generation: number; rootChildId: string }[] = childIdsOf(
    modelService,
    rootId,
  ).map((childId) => ({ id: childId, generation: 1, rootChildId: childId }));

  while (queue.length > 0) {
    const { id, generation, rootChildId } = queue.shift()!;
    const node = modelService.getNodeById<FamilyTreeNodeData>(id);
    if (!node) continue;

    if (isOccupiedNode(node) && node.data.deathYear === undefined) {
      results.push({ node, generation, rootChildId });
      continue;
    }

    for (const childId of childIdsOf(modelService, id)) {
      queue.push({ id: childId, generation: generation + 1, rootChildId });
    }
  }

  return results;
}

/** Returns `[id, parentId, grandparentId, ..., rootId]` — `id`'s ancestor chain, nearest first. */
function getAncestorChain(hierarchyService: HierarchyService, id: string): string[] {
  const chain = [id];
  let current = id;
  while (true) {
    const parentId = hierarchyService.getParentId(current);
    if (!parentId) break;
    chain.push(parentId);
    current = parentId;
  }
  return chain;
}

const ORDINAL_WORDS = [
  'zeroth',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
];

/** Spells out small ordinals ("first", "second", ...) and falls back to "11th", "12th", etc. beyond ten. */
function ordinal(n: number): string {
  if (n >= 0 && n < ORDINAL_WORDS.length) return ORDINAL_WORDS[n];
  const lastTwo = n % 100;
  const lastDigit = n % 10;
  const suffix =
    lastTwo >= 11 && lastTwo <= 13
      ? 'th'
      : lastDigit === 1
        ? 'st'
        : lastDigit === 2
          ? 'nd'
          : lastDigit === 3
            ? 'rd'
            : 'th';
  return `${n}${suffix}`;
}

/** "parent" / "grandparent" / "great-grandparent" / "great-great-grandparent" / ... for the given generation gap. */
function ancestorLabel(generations: number): string {
  if (generations === 1) return 'parent';
  return `${'great-'.repeat(Math.max(0, generations - 2))}grandparent`;
}

/** "child" / "grandchild" / "great-grandchild" / ... — the mirror of {@link ancestorLabel}. */
function descendantLabel(generations: number): string {
  if (generations === 1) return 'child';
  return `${'great-'.repeat(Math.max(0, generations - 2))}grandchild`;
}

/**
 * Describes how person A relates to person B (and vice versa) given each
 * one's distance, in generations, from their lowest common ancestor.
 * `depthA`/`depthB` of `0` means that person IS the common ancestor.
 */
function describeRelationship(depthA: number, depthB: number): { aToB: string; bToA: string } {
  if (depthA === 0 && depthB === 0) {
    return { aToB: 'the same person as', bToA: 'the same person as' };
  }
  if (depthA === 0) {
    return { aToB: ancestorLabel(depthB), bToA: descendantLabel(depthB) };
  }
  if (depthB === 0) {
    return { aToB: descendantLabel(depthA), bToA: ancestorLabel(depthA) };
  }

  const diff = Math.abs(depthA - depthB);
  const cousinDegree = Math.min(depthA, depthB) - 1;

  if (cousinDegree === 0) {
    if (diff === 0) {
      return { aToB: 'sibling', bToA: 'sibling' };
    }
    const greats = 'great-'.repeat(diff - 1);
    const auntUncle = `${greats}aunt/uncle`;
    const nieceNephew = `${greats}niece/nephew`;
    return depthA < depthB
      ? { aToB: auntUncle, bToA: nieceNephew }
      : { aToB: nieceNephew, bToA: auntUncle };
  }

  const removedSuffix =
    diff === 0 ? '' : `, ${diff === 1 ? 'once' : diff === 2 ? 'twice' : `${diff} times`} removed`;
  const cousinLabel = `${ordinal(cousinDegree)} cousin${removedSuffix}`;
  return { aToB: cousinLabel, bToA: cousinLabel };
}

/**
 * Registers all WebMCP tools that let an AI agent read and manipulate the
 * family tree: querying people, adding/updating/removing them, exploring
 * relationships (siblings, ancestors, alive descendants, relationship
 * classification), and controlling the diagram's view (focus, layout
 * direction, zoom, subtree collapse, child ordering) and data export.
 *
 * Must be called from within an injection context that has access to the
 * family-tree page's own providers (NgDiagramModelService,
 * NgDiagramSelectionService, NgDiagramViewportService, AddNodeService,
 * NodeMutationService, HierarchyService, SortOrderService,
 * ExpandCollapseService, LayoutService, ModelApplyService,
 * NodeVisibilityService, PropertiesSidebarService) — e.g. a page
 * component's constructor.
 */
export function registerPeopleWebMcpTools(): void {
  const modelService = inject(NgDiagramModelService);
  const selectionService = inject(NgDiagramSelectionService);
  const viewportService = inject(NgDiagramViewportService);
  const addNodeService = inject(AddNodeService);
  const nodeMutationService = inject(NodeMutationService);
  const hierarchyService = inject(HierarchyService);
  const sortOrderService = inject(SortOrderService);
  const expandCollapseService = inject(ExpandCollapseService);
  const layoutService = inject(LayoutService);
  const modelApplyService = inject(ModelApplyService);
  const nodeVisibilityService = inject(NodeVisibilityService);
  const propertiesSidebarService = inject(PropertiesSidebarService);
  const messageService = inject(MessageService);

  /**
   * Wraps a tool's `execute` callback so a toast is shown once it resolves, naming the
   * invoked tool. Used for every WebMCP tool below so an agent's actions are visible in
   * the UI as they happen.
   */
  function withToast<Args extends unknown[], Result>(
    name: string,
    execute: (...args: Args) => Result | Promise<Result>,
  ): (...args: Args) => Promise<Result> {
    return async (...args: Args) => {
      const result = await execute(...args);
      messageService.add({
        severity: 'info',
        summary: 'WebMCP tool invoked',
        detail: name,
        life: 3000,
      });
      return result;
    };
  }

  declareExperimentalWebMcpTool({
    name: 'list_people',
    description:
      'Lists people in the family tree, optionally filtered by a free-text query (matches first name, ' +
      'last name, or spouse name), living status, birth-year range, or whether they have children. ' +
      'Returns a summary for each matching person (no need to call get_person afterwards unless you ' +
      'need full details for a single person).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Free-text filter matched against first name, last name, and spouse name (case-insensitive).',
        },
        status: {
          type: 'string',
          enum: ['alive', 'deceased'],
          description:
            'Only include people who are alive (no death year) or deceased (has a death year).',
        },
        bornAfter: {
          type: 'number',
          description: 'Only include people born strictly after this year.',
        },
        bornBefore: {
          type: 'number',
          description: 'Only include people born strictly before this year.',
        },
        hasChildren: {
          type: 'boolean',
          description:
            'Only include people who do (true) or do not (false) have any children in the tree.',
        },
      },
    },
    execute: withToast(
      'list_people',
      async (input: {
        query?: string;
        status?: 'alive' | 'deceased';
        bornAfter?: number;
        bornBefore?: number;
        hasChildren?: boolean;
      }) => {
        const nodes = modelService.nodes() as Node<FamilyTreeNodeData>[];
        const results: PersonSummary[] = [];
        for (const node of nodes) {
          if (!isOccupiedNode(node)) continue;
          const data = node.data as FamilyTreeOccupiedNodeData;
          if (input.query && !matchesQuery(data, input.query)) continue;
          if (input.status === 'alive' && data.deathYear) continue;
          if (input.status === 'deceased' && !data.deathYear) continue;
          if (
            input.bornAfter !== undefined &&
            (!data.birthYear || data.birthYear <= input.bornAfter)
          )
            continue;
          if (
            input.bornBefore !== undefined &&
            (!data.birthYear || data.birthYear >= input.bornBefore)
          )
            continue;
          const childIds = childIdsOf(modelService, node.id);
          if (input.hasChildren === true && childIds.length === 0) continue;
          if (input.hasChildren === false && childIds.length > 0) continue;
          const parentId = hierarchyService.getParentId(node.id);
          results.push(toPersonSummary(node.id, data, parentId, childIds));
        }
        return { people: results, count: results.length };
      },
    ),
  });

  declareExperimentalWebMcpTool({
    name: 'get_person',
    description:
      'Gets full details for a single person by id, including their parent id and the ids of their children.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the person node.' },
      },
      required: ['id'],
    },
    execute: withToast('get_person', async (input: { id: string }) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const data = node.data as FamilyTreeOccupiedNodeData;
      const parentId = hierarchyService.getParentId(node.id);
      const childIds = childIdsOf(modelService, node.id);
      return { person: toPersonSummary(node.id, data, parentId, childIds) };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'add_person',
    description:
      'Adds a new person to the family tree as a child of an existing person. The diagram will select ' +
      'and pan/zoom to the newly added person after it is added.',
    inputSchema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'The id of the existing person to add this new person as a child of.',
        },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        gender: { type: 'string', enum: GENDER_ENUM },
        birthYear: { type: 'number' },
        deathYear: { type: 'number' },
        spouseFirstName: { type: 'string' },
        spouseLastName: { type: 'string' },
        spouseGender: { type: 'string', enum: GENDER_ENUM },
        spouseBirthYear: { type: 'number' },
        spouseDeathYear: { type: 'number' },
      },
      required: ['parentId'],
    },
    execute: withToast('add_person', async (input: { parentId: string } & PersonFieldsInput) => {
      const parentNode = modelService.getNodeById<FamilyTreeNodeData>(input.parentId);
      if (!parentNode) {
        return { error: `No person found with id "${input.parentId}".` };
      }
      if (!input.firstName) {
        return { error: 'firstName is required to add a person.' };
      }
      const newNodeId = await addNodeService.addNode(input.parentId, 'child');
      if (!newNodeId) {
        return { error: 'Failed to add the new person.' };
      }
      const newNode = modelService.getNodeById<FamilyTreeNodeData>(newNodeId)!;
      const formData = applyPersonFieldsToFormData(EMPTY_FORM, input);
      modelService.updateNodeData(newNodeId, formDataToNodeData(formData, newNode.data));
      selectionService.select([newNodeId]);
      await viewportService.zoomToFit({ nodeIds: [newNodeId] });
      return { id: newNodeId, message: 'Person added.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'update_person',
    description:
      "Updates an existing person's details. Only the provided fields are changed; omitted fields are " +
      'left as-is. The diagram will select and pan/zoom to the updated person.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the person to update.' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        gender: { type: 'string', enum: GENDER_ENUM },
        birthYear: { type: 'number' },
        deathYear: { type: 'number' },
        spouseFirstName: { type: 'string' },
        spouseLastName: { type: 'string' },
        spouseGender: { type: 'string', enum: GENDER_ENUM },
        spouseBirthYear: { type: 'number' },
        spouseDeathYear: { type: 'number' },
      },
      required: ['id'],
    },
    execute: withToast('update_person', async (input: { id: string } & PersonFieldsInput) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const parentId = hierarchyService.getParentId(input.id);
      const currentFormData = nodeDataToFormData(node.data, parentId);
      const mergedFormData = applyPersonFieldsToFormData(currentFormData, input);
      modelService.updateNodeData(input.id, formDataToNodeData(mergedFormData, node.data));
      selectionService.select([input.id]);
      await viewportService.zoomToFit({ nodeIds: [input.id] });
      return { id: input.id, message: 'Person updated.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'get_alive_descendants',
    description:
      'Finds the nearest living descendants of a person for succession/inheritance purposes: for each ' +
      'branch, exploration stops as soon as a living descendant is found (their own children are not ' +
      'listed, since the living descendant is the nearest heir on that branch). This tool returns ' +
      'genealogical facts only — it does not determine legal heirs, inheritance shares, or entitlement, ' +
      'which depend on jurisdiction and should be confirmed with a legal professional.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the person whose nearest living descendants to find.',
        },
      },
      required: ['id'],
    },
    execute: withToast('get_alive_descendants', async (input: { id: string }) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const descendants = collectNearestAliveDescendants(modelService, input.id);
      return {
        rootId: input.id,
        aliveDescendants: descendants,
        count: descendants.length,
        note: 'These are genealogical facts only, not a legal determination of heirs or inheritance shares.',
      };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'get_siblings',
    description: "Gets a person's siblings (other people sharing the same parent).",
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the person whose siblings to find.' },
      },
      required: ['id'],
    },
    execute: withToast('get_siblings', async (input: { id: string }) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const parentId = hierarchyService.getParentId(input.id);
      if (!parentId) {
        return { siblings: [], count: 0 };
      }
      const siblingIds = childIdsOf(modelService, parentId).filter((id) => id !== input.id);
      const siblings: PersonSummary[] = [];
      for (const siblingId of siblingIds) {
        const siblingNode = modelService.getNodeById<FamilyTreeNodeData>(siblingId);
        if (!siblingNode || !isOccupiedNode(siblingNode)) continue;
        const data = siblingNode.data as FamilyTreeOccupiedNodeData;
        siblings.push(
          toPersonSummary(siblingId, data, parentId, childIdsOf(modelService, siblingId)),
        );
      }
      return { siblings, count: siblings.length };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'get_ancestors',
    description:
      "Gets a person's ancestor chain (parent, grandparent, great-grandparent, ...), ordered from " +
      'nearest to most distant.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the person whose ancestors to find.' },
      },
      required: ['id'],
    },
    execute: withToast('get_ancestors', async (input: { id: string }) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const chain = getAncestorChain(hierarchyService, input.id).slice(1);
      const ancestors: (PersonSummary & { generationsUp: number; relationship: string })[] = [];
      chain.forEach((ancestorId, index) => {
        const ancestorNode = modelService.getNodeById<FamilyTreeNodeData>(ancestorId);
        if (!ancestorNode || !isOccupiedNode(ancestorNode)) return;
        const data = ancestorNode.data as FamilyTreeOccupiedNodeData;
        const generationsUp = index + 1;
        const parentId = hierarchyService.getParentId(ancestorId);
        ancestors.push({
          ...toPersonSummary(ancestorId, data, parentId, childIdsOf(modelService, ancestorId)),
          generationsUp,
          relationship: ancestorLabel(generationsUp),
        });
      });
      return { ancestors, count: ancestors.length };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'find_relationship',
    description:
      'Determines how two people in the tree are related to each other (e.g. parent, sibling, ' +
      'aunt/uncle, first cousin once removed), by finding their lowest common ancestor. Returns facts ' +
      'about the family relationship only, not any legal or inheritance implications.',
    inputSchema: {
      type: 'object',
      properties: {
        firstId: { type: 'string', description: 'The id of the first person.' },
        secondId: { type: 'string', description: 'The id of the second person.' },
      },
      required: ['firstId', 'secondId'],
    },
    execute: withToast(
      'find_relationship',
      async (input: { firstId: string; secondId: string }) => {
        const nodeA = modelService.getNodeById<FamilyTreeNodeData>(input.firstId);
        const nodeB = modelService.getNodeById<FamilyTreeNodeData>(input.secondId);
        if (!nodeA || !isOccupiedNode(nodeA)) {
          return { error: `No person found with id "${input.firstId}".` };
        }
        if (!nodeB || !isOccupiedNode(nodeB)) {
          return { error: `No person found with id "${input.secondId}".` };
        }
        const chainA = getAncestorChain(hierarchyService, input.firstId);
        const chainB = getAncestorChain(hierarchyService, input.secondId);
        const chainBIndex = new Map(chainB.map((id, index) => [id, index]));
        let commonAncestorId: string | null = null;
        let depthA = -1;
        let depthB = -1;
        for (let i = 0; i < chainA.length; i++) {
          const candidate = chainA[i];
          if (chainBIndex.has(candidate)) {
            commonAncestorId = candidate;
            depthA = i;
            depthB = chainBIndex.get(candidate)!;
            break;
          }
        }
        if (commonAncestorId === null) {
          return {
            related: false,
            message: 'These two people share no common ancestor in the tree.',
          };
        }
        const { aToB, bToA } = describeRelationship(depthA, depthB);
        const nameA = formatFullName(
          (nodeA.data as FamilyTreeOccupiedNodeData).firstName,
          (nodeA.data as FamilyTreeOccupiedNodeData).lastName,
        );
        const nameB = formatFullName(
          (nodeB.data as FamilyTreeOccupiedNodeData).firstName,
          (nodeB.data as FamilyTreeOccupiedNodeData).lastName,
        );
        return {
          related: true,
          firstId: input.firstId,
          secondId: input.secondId,
          commonAncestorId,
          relationshipOfFirstToSecond: aToB,
          relationshipOfSecondToFirst: bToA,
          summary: `${nameA} is the ${aToB} of ${nameB}.`,
          note: 'This describes the family relationship only, not any legal or inheritance implications.',
        };
      },
    ),
  });

  declareExperimentalWebMcpTool({
    name: 'focus_people',
    description:
      'Selects one or more people in the diagram and pans/zooms the viewport to fit them together with ' +
      'all of their descendants, so that whole descendant subtree fills the available viewport (like ' +
      "zoom_to_fit, but scoped to the target(s) and their descendants instead of the whole tree). Doesn't " +
      "change any data. Useful for drawing the user or another tool's attention to specific people and " +
      'their branch of the family.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'The ids of the people to select and focus on.',
        },
      },
      required: ['ids'],
    },
    execute: withToast('focus_people', async (input: { ids: string[] }) => {
      if (!input.ids || input.ids.length === 0) {
        return { error: 'Provide at least one person id.' };
      }
      const missing = input.ids.filter((id) => !modelService.getNodeById(id));
      if (missing.length > 0) {
        return { error: `Unknown person id(s): ${missing.join(', ')}.` };
      }
      selectionService.select(input.ids);

      // Fit the requested people together with their entire descendant subtree, so the
      // branch fills the viewport rather than just the (typically tiny) selected node(s).
      const fitNodeIds = new Set<string>(input.ids);
      for (const id of input.ids) {
        for (const descendantId of collectAllDescendantIds(modelService, id)) {
          fitNodeIds.add(descendantId);
        }
      }
      // zoomToFit includes ALL edges by default when edgeIds isn't passed, which would pull
      // in the rest of the tree — restrict it to edges that stay within the fit node set.
      const fitEdgeIds = new Set<string>();
      for (const id of fitNodeIds) {
        for (const edge of modelService.getConnectedEdges(id)) {
          if (fitNodeIds.has(edge.source) && fitNodeIds.has(edge.target)) {
            fitEdgeIds.add(edge.id);
          }
        }
      }

      if (fitEdgeIds.size > 0) {
        await viewportService.zoomToFit({ nodeIds: [...fitNodeIds], edgeIds: [...fitEdgeIds] });
      } else {
        // No edges stay within the fit set — e.g. focusing a person with no descendants.
        // An empty edgeIds array isn't usable here (see computeNodesBounds' doc comment), so
        // fit purely from node bounds instead.
        await zoomToFitNodesOnly(modelService, viewportService, fitNodeIds);
      }
      return { ids: input.ids, message: 'Focused on the requested people and their descendants.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'show_community_cv',
    description:
      "Opens Gérôme Grignon's community-CV panel: a full-viewport takeover, in place of the " +
      'properties sidebar, showing a 2x2 grid of highlight cards (Optimus UI, Discord Admin, ' +
      "Angular Can I Use, NG Baguette Conf). Selects his node if it isn't already selected, " +
      'then opens the panel — equivalent to the user clicking the star toggle in the properties ' +
      'sidebar while his node is selected. Use this for requests like "show Gérôme Grignon\'s ' +
      'highlights/contributions/CV" or "open the community CV".',
    inputSchema: { type: 'object', properties: {} },
    execute: withToast('show_community_cv', async () => {
      // Temporary breadcrumbs (2026-09-10): this tool has silently no-op'd once already
      // (see the await fix below) with zero visible error, so trace every step to the
      // console until it's confirmed working live. Safe to remove once confirmed.
      console.debug('[show_community_cv] invoked');
      const node = modelService
        .nodes()
        .find((n) => isOccupiedNode(n) && isCommunityCvSubject(n.data));
      if (!node) {
        console.debug('[show_community_cv] no matching node found in modelService.nodes()');
        return {
          error:
            'No person named "Gérôme Grignon" was found in the current tree, so the community-CV ' +
            "panel — which only ever shows his highlights — can't be opened.",
        };
      }
      console.debug('[show_community_cv] node found:', node.id);
      try {
        // `select()` returns the underlying command's promise — it must be awaited before
        // `openCommunityCv()` reads the selection back (via `focusedOnCommunityCvSubject()`),
        // otherwise that guard still sees the *previous* selection and silently no-ops.
        await selectionService.select([node.id]);
        console.debug('[show_community_cv] selection resolved, selected node is now:', {
          selectedNodeId: modelService.nodes().find((n) => n.selected)?.id,
        });
        propertiesSidebarService.openCommunityCv();
        console.debug('[show_community_cv] openCommunityCv() called, isCommunityCvActive:', {
          isExpanded: propertiesSidebarService.isExpanded(),
          showCommunityCv: propertiesSidebarService.showCommunityCv(),
          focusedOnCommunityCvSubject: propertiesSidebarService.focusedOnCommunityCvSubject(),
        });
      } catch (err) {
        console.error('[show_community_cv] threw:', err);
        throw err;
      }
      return { id: node.id, message: "Opened Gérôme Grignon's community-CV panel." };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'set_layout_direction',
    description:
      'Changes the tree layout direction (top-to-bottom or left-to-right) and re-lays out the diagram.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: LAYOUT_DIRECTION_ENUM,
          description: "'DOWN' for a top-to-bottom tree, 'RIGHT' for a left-to-right tree.",
        },
      },
      required: ['direction'],
    },
    execute: withToast('set_layout_direction', async (input: { direction: LayoutDirection }) => {
      layoutService.setDirection(input.direction);
      await modelApplyService.applyWithLayout();
      await viewportService.zoomToFit();
      return { direction: input.direction, message: 'Layout direction changed.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'zoom_to_fit',
    description:
      'Pans/zooms the viewport so the entire family tree is visible, without changing any data.',
    inputSchema: { type: 'object', properties: {} },
    execute: withToast('zoom_to_fit', async () => {
      await viewportService.zoomToFit();
      return { message: 'Zoomed to fit the diagram.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'add_people',
    description:
      'Adds multiple people to the family tree in one call. Each entry needs a unique "tempId" (used only ' +
      'within this call to reference other new entries) and exactly one of "parentId" (an existing person\'s ' +
      'id) or "parentTempId" (another entry\'s tempId, for building multi-generation batches in one call, e.g. ' +
      "adding a child and that child's own child together). The diagram will select and pan/zoom to fit all " +
      'newly added people afterwards.',
    inputSchema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tempId: {
                type: 'string',
                description: 'A unique identifier for this entry, used only within this call.',
              },
              parentId: {
                type: 'string',
                description: 'The id of an existing person to add this entry as a child of.',
              },
              parentTempId: {
                type: 'string',
                description: "Another entry's tempId to add this entry as a child of.",
              },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              gender: { type: 'string', enum: GENDER_ENUM },
              birthYear: { type: 'number' },
              deathYear: { type: 'number' },
              spouseFirstName: { type: 'string' },
              spouseLastName: { type: 'string' },
              spouseGender: { type: 'string', enum: GENDER_ENUM },
              spouseBirthYear: { type: 'number' },
              spouseDeathYear: { type: 'number' },
            },
            required: ['tempId'],
          },
        },
      },
      required: ['entries'],
    },
    execute: withToast(
      'add_people',
      async (input: {
        entries: Array<
          { tempId: string; parentId?: string; parentTempId?: string } & PersonFieldsInput
        >;
      }) => {
        const entries = input.entries;
        if (!entries || entries.length === 0) {
          return { error: 'No entries provided.' };
        }

        const tempIds = new Set<string>();
        for (const entry of entries) {
          if (!entry.tempId) {
            return { error: 'Every entry must have a tempId.' };
          }
          if (tempIds.has(entry.tempId)) {
            return { error: `Duplicate tempId "${entry.tempId}".` };
          }
          tempIds.add(entry.tempId);
          const hasParentId = !!entry.parentId;
          const hasParentTempId = !!entry.parentTempId;
          if (hasParentId === hasParentTempId) {
            return {
              error: `Entry "${entry.tempId}" must specify exactly one of parentId or parentTempId.`,
            };
          }
          if (hasParentId && !modelService.getNodeById(entry.parentId!)) {
            return {
              error: `Entry "${entry.tempId}" references unknown parentId "${entry.parentId}".`,
            };
          }
          if (!entry.firstName) {
            return { error: `Entry "${entry.tempId}" is missing a required firstName.` };
          }
        }

        const entryByTempId = new Map(entries.map((entry) => [entry.tempId, entry]));
        for (const entry of entries) {
          if (entry.parentTempId && !entryByTempId.has(entry.parentTempId)) {
            return {
              error: `Entry "${entry.tempId}" references unknown parentTempId "${entry.parentTempId}".`,
            };
          }
        }

        for (const entry of entries) {
          const seen = new Set<string>([entry.tempId]);
          let current = entry;
          while (current.parentTempId) {
            if (seen.has(current.parentTempId)) {
              return {
                error: `Circular parentTempId reference detected involving "${entry.tempId}".`,
              };
            }
            seen.add(current.parentTempId);
            current = entryByTempId.get(current.parentTempId)!;
          }
        }

        const resolvedRealId = new Map<string, string>();
        const remaining = [...entries];
        const added: { tempId: string; id: string }[] = [];
        let guard = 0;
        while (remaining.length > 0) {
          guard++;
          if (guard > entries.length * entries.length + 10) {
            return { error: 'Could not resolve parent order for entries.', added };
          }
          const index = remaining.findIndex(
            (entry) => entry.parentId || resolvedRealId.has(entry.parentTempId!),
          );
          if (index === -1) {
            return { error: 'Could not resolve parent order for remaining entries.', added };
          }
          const [entry] = remaining.splice(index, 1);
          const parentRealId = entry.parentId ?? resolvedRealId.get(entry.parentTempId!)!;
          const newId = await addNodeService.addNode(parentRealId, 'child');
          if (!newId) {
            return { error: `Failed to add person for tempId "${entry.tempId}".`, added };
          }
          const newNode = modelService.getNodeById<FamilyTreeNodeData>(newId)!;
          const formData = applyPersonFieldsToFormData(EMPTY_FORM, entry);
          modelService.updateNodeData(newId, formDataToNodeData(formData, newNode.data));
          resolvedRealId.set(entry.tempId, newId);
          added.push({ tempId: entry.tempId, id: newId });
        }

        const newIds = added.map((entry) => entry.id);
        selectionService.select(newIds);
        await viewportService.zoomToFit({ nodeIds: newIds });
        return { added, count: added.length, message: `Added ${added.length} people.` };
      },
    ),
  });

  declareExperimentalWebMcpTool({
    name: 'remove_person',
    description:
      'Removes a person from the family tree. If the person has descendants, this fails unless "cascade" ' +
      'is set to true, in which case all of their descendants are removed as well.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the person to remove.' },
        cascade: {
          type: 'boolean',
          description: 'If true, also removes all descendants of this person. Defaults to false.',
        },
      },
      required: ['id'],
    },
    execute: withToast('remove_person', async (input: { id: string; cascade?: boolean }) => {
      const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
      if (!node || !isOccupiedNode(node)) {
        return { error: `No person found with id "${input.id}".` };
      }
      const descendantIds = collectAllDescendantIds(modelService, input.id);
      if (descendantIds.length > 0 && !input.cascade) {
        return {
          error:
            `Person "${input.id}" has ${descendantIds.length} descendant(s). Pass cascade: true to remove ` +
            'them as well, or remove/reassign descendants first.',
          descendantCount: descendantIds.length,
        };
      }
      for (const descendantId of [...descendantIds].reverse()) {
        await nodeMutationService.removeNode(descendantId);
      }
      await nodeMutationService.removeNode(input.id);
      return { id: input.id, removedCount: descendantIds.length + 1, message: 'Person removed.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'set_subtree_collapsed',
    description:
      "Expands or collapses a person's subtree in the diagram (hiding or showing their descendants), " +
      'without changing any person data.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The id of the person whose subtree to expand or collapse.',
        },
        collapsed: {
          type: 'boolean',
          description: 'true to collapse (hide descendants), false to expand.',
        },
      },
      required: ['id', 'collapsed'],
    },
    execute: withToast(
      'set_subtree_collapsed',
      async (input: { id: string; collapsed: boolean }) => {
        const node = modelService.getNodeById<FamilyTreeNodeData>(input.id);
        if (!node || !isOccupiedNode(node)) {
          return { error: `No person found with id "${input.id}".` };
        }
        const isCurrentlyCollapsed = getIsCollapsed({
          data: node.data as Partial<FamilyTreeBaseNodeData>,
        });
        if (isCurrentlyCollapsed === input.collapsed) {
          return {
            id: input.id,
            collapsed: input.collapsed,
            message: 'Subtree already in the requested state.',
          };
        }
        const result = expandCollapseService.prepareToggle(input.id);
        if (!result) {
          return {
            error: `Unable to toggle the subtree for "${input.id}" (it may have no children).`,
          };
        }
        await modelApplyService.applyWithLayout(result.changes, {
          visibility: { subtreeIds: result.toggledSubtreeIds, collapsing: result.collapsing },
        });
        nodeVisibilityService.ensureVisible(input.id);
        return {
          id: input.id,
          collapsed: input.collapsed,
          message: `Subtree ${input.collapsed ? 'collapsed' : 'expanded'}.`,
        };
      },
    ),
  });

  declareExperimentalWebMcpTool({
    name: 'reorder_children',
    description:
      'Changes the display order of a person\'s children. "order" must contain exactly the current ' +
      "children's ids, in the desired new order.",
    inputSchema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'The id of the parent whose children to reorder.',
        },
        order: {
          type: 'array',
          items: { type: 'string' },
          description:
            "The child ids in the desired new order (must be a permutation of the parent's current children).",
        },
      },
      required: ['parentId', 'order'],
    },
    execute: withToast('reorder_children', async (input: { parentId: string; order: string[] }) => {
      const parentNode = modelService.getNodeById(input.parentId);
      if (!parentNode) {
        return { error: `No person found with id "${input.parentId}".` };
      }
      const currentChildIds = childIdsOf(modelService, input.parentId);
      const currentSet = new Set(currentChildIds);
      const orderSet = new Set(input.order);
      const isValidPermutation =
        input.order.length === currentChildIds.length &&
        currentChildIds.every((id) => orderSet.has(id)) &&
        input.order.every((id) => currentSet.has(id));
      if (!isValidPermutation) {
        return {
          error:
            `"order" must be exactly a permutation of the current children of "${input.parentId}": ` +
            `[${currentChildIds.join(', ')}].`,
        };
      }
      const changes = new ModelChanges();
      input.order.forEach((childId, index) => {
        changes.addNodeUpdates({ id: childId, data: { sortOrder: index } });
      });
      await modelApplyService.applyWithLayout(changes);
      return { parentId: input.parentId, order: input.order, message: 'Children reordered.' };
    }),
  });

  declareExperimentalWebMcpTool({
    name: 'export_tree',
    description: 'Exports the entire family tree diagram (all nodes and edges) as structured JSON.',
    inputSchema: { type: 'object', properties: {} },
    execute: withToast('export_tree', async () => {
      const json = modelService.toJSON();
      return { tree: JSON.parse(json) };
    }),
  });
}
