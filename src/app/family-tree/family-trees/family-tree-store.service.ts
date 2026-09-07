import { computed, Injectable, signal } from '@angular/core';
import { type Edge, type Node } from 'ng-diagram';
import { diagramModel as grignonSeedModel } from '../diagram/data';
import {
  NodeTemplateType,
  type FamilyTreeEdgeData,
  type FamilyTreeNodeData,
} from '../diagram/model/interfaces';

/** One entry in the family-tree switcher. */
export interface FamilyTreeSummary {
  id: string;
  name: string;
}

/** The nodes/edges that make up a single family tree's diagram. */
export interface FamilyTreeData {
  nodes: Node<FamilyTreeNodeData>[];
  edges: Edge<FamilyTreeEdgeData>[];
}

/** Sentinel `<option>` value for "Add new family tree" in the switcher select. */
export const ADD_NEW_FAMILY_TREE_VALUE = '__add-new-family-tree__';

const INDEX_STORAGE_KEY = 'family-trees:index';
const ACTIVE_STORAGE_KEY = 'family-trees:active';
const DATA_STORAGE_KEY_PREFIX = 'family-trees:data:';

const DEFAULT_TREE_ID = 'grignon';
const DEFAULT_TREE_NAME = 'Grignon';

/**
 * Manages the list of family trees and their diagram data in `localStorage`,
 * so multiple family trees can be created and switched between.
 *
 * The default "Grignon" tree is special: as long as nothing has been saved
 * for it yet, its data comes from the static seed in `diagram/data.ts`
 * rather than an empty tree. Once it's edited, the saved copy in
 * `localStorage` takes over.
 */
@Injectable()
export class FamilyTreeStoreService {
  private readonly _trees = signal<FamilyTreeSummary[]>(this.loadIndex());
  private readonly _activeTreeId = signal<string>(this.resolveActiveId());

  /** All known family trees, in creation order. */
  readonly trees = this._trees.asReadonly();
  /** ID of the currently selected family tree. */
  readonly activeTreeId = this._activeTreeId.asReadonly();
  /** Summary of the currently selected family tree. */
  readonly activeTree = computed<FamilyTreeSummary | undefined>(() =>
    this._trees().find((tree) => tree.id === this._activeTreeId()),
  );

  /** Loads the diagram data (nodes/edges) for the currently active tree. */
  loadActiveTreeData(): FamilyTreeData {
    return this.loadTreeData(this._activeTreeId());
  }

  /** Persists nodes/edges for the currently active tree. */
  saveActiveTreeData(data: FamilyTreeData): void {
    this.persist(DATA_STORAGE_KEY_PREFIX + this._activeTreeId(), JSON.stringify(data));
  }

  /** Switches the active family tree. No-op if `id` isn't a known tree. */
  setActiveTree(id: string): void {
    if (id === this._activeTreeId() || !this._trees().some((tree) => tree.id === id)) return;
    this._activeTreeId.set(id);
    this.persist(ACTIVE_STORAGE_KEY, id);
  }

  /**
   * Creates a new, empty family tree (seeded with a single unfilled root
   * person) and makes it the active tree.
   *
   * @param name - Display name for the new tree. Blank names are rejected.
   * @returns The new tree's ID, or `undefined` if `name` was blank.
   */
  createTree(name: string): string | undefined {
    const trimmedName = name.trim();
    if (!trimmedName) return undefined;

    const id = this.generateTreeId(trimmedName);
    const trees = [...this._trees(), { id, name: trimmedName }];
    this._trees.set(trees);
    this.persist(INDEX_STORAGE_KEY, JSON.stringify(trees));
    this.persist(DATA_STORAGE_KEY_PREFIX + id, JSON.stringify(this.createSeedTreeData()));

    this._activeTreeId.set(id);
    this.persist(ACTIVE_STORAGE_KEY, id);

    return id;
  }

  private loadTreeData(id: string): FamilyTreeData {
    const raw = this.read(DATA_STORAGE_KEY_PREFIX + id);
    if (raw) {
      const parsed = this.tryParse<Partial<FamilyTreeData>>(raw);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return { nodes: parsed.nodes, edges: parsed.edges };
      }
    }
    return id === DEFAULT_TREE_ID ? grignonSeedModel : this.createSeedTreeData();
  }

  /** A brand-new tree starts with one empty, unfilled person to fill in via the sidebar. */
  private createSeedTreeData(): FamilyTreeData {
    return {
      nodes: [
        {
          id: crypto.randomUUID(),
          type: NodeTemplateType.FamilyTreeNode,
          position: { x: 0, y: 0 },
          data: { type: 'vacant', isCollapsed: false, hasChildren: false, sortOrder: 0 },
        },
      ],
      edges: [],
    };
  }

  private loadIndex(): FamilyTreeSummary[] {
    const raw = this.read(INDEX_STORAGE_KEY);
    const parsed = raw ? this.tryParse<FamilyTreeSummary[]>(raw) : null;
    if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [{ id: DEFAULT_TREE_ID, name: DEFAULT_TREE_NAME }];
  }

  private resolveActiveId(): string {
    const stored = this.read(ACTIVE_STORAGE_KEY);
    const trees = this._trees();
    if (stored && trees.some((tree) => tree.id === stored)) return stored;
    return trees[0]?.id ?? DEFAULT_TREE_ID;
  }

  /** Slugifies `name` into an id, disambiguating against existing tree ids. */
  private generateTreeId(name: string): string {
    const base =
      name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'family-tree';

    const existingIds = new Set(this._trees().map((tree) => tree.id));
    if (!existingIds.has(base)) return base;

    let suffix = 2;
    while (existingIds.has(`${base}-${suffix}`)) suffix++;
    return `${base}-${suffix}`;
  }

  private tryParse<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private persist(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) — edits just won't persist.
    }
  }
}
