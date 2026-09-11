import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Node } from 'ng-diagram';
import { isOccupiedNode, isFamilyTreeNode } from '../diagram/model/guards';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import {
  Gender,
  GENDER_LABELS,
  type FamilyTreeNodeData,
  type FamilyTreeOccupiedNodeData,
} from '../diagram/model/interfaces';
import { type SelectOption } from '../shared/select-option/select-option';
import { isCommunityCvSubject } from './community-cv/community-cv-match';

/**
 * Manages sidebar visibility state and exposes selection-derived data
 * (selected nodes, parent info, parent-field candidates).
 */
@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);

  readonly isExpanded = signal(false);

  readonly selectedFamilyTreeNodes = computed<Node<FamilyTreeNodeData>[]>(() =>
    this.selectionService.selection().nodes.filter(isFamilyTreeNode),
  );
  readonly selectedNode = computed<Node<FamilyTreeNodeData> | undefined>(() =>
    this.selectedFamilyTreeNodes().at(0),
  );

  /** Valid parent targets: all occupied nodes except the selected node and its descendants. */
  readonly parentCandidateNodes = computed<Node<FamilyTreeOccupiedNodeData>[]>(() => {
    const selectedNode = this.selectedNode();
    if (!selectedNode) return [];
    const descendantIds = this.hierarchyService.getDescendantIds(selectedNode.id);
    return this.modelService
      .nodes()
      .filter(
        (node): node is Node<FamilyTreeOccupiedNodeData> =>
          node.id !== selectedNode.id && !descendantIds.has(node.id) && isOccupiedNode(node),
      );
  });

  readonly genderOptions: SelectOption<Gender>[] = Object.values(Gender).map((gender) => ({
    value: gender,
    label: GENDER_LABELS[gender],
  }));

  readonly selectedNodeParentId = computed<string | null>(() => {
    const node = this.selectedNode();
    return node ? this.hierarchyService.getParentId(node.id) : null;
  });

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const selectedNodes = this.selectedFamilyTreeNodes();
    if (selectedNodes.length === 0) return 'empty';
    if (selectedNodes.length > 1) return 'multi';
    return 'single';
  });

  /** True only when the selected node is Gérôme Grignon — see `community-cv-match.ts`. */
  readonly focusedOnCommunityCvSubject = computed<boolean>(() =>
    isCommunityCvSubject(this.selectedNode()?.data),
  );

  /** Whether the full-viewport community-CV takeover (star toggle) is currently on. */
  readonly showCommunityCv = signal(false);
  readonly isCommunityCvActive = computed(
    () => this.showCommunityCv() && this.focusedOnCommunityCvSubject(),
  );

  constructor() {
    // Close the community-CV takeover as soon as the selection moves away
    // from Gérôme Grignon (a different node, or nothing). Tracks
    // `focusedOnCommunityCvSubject` rather than the selected node's id so
    // that *becoming* the subject again (re-selecting his node, including
    // programmatically — see the `show_community_cv` WebMCP tool) never
    // trips this reset: the effect only ever turns the takeover off, and
    // only when the newly-selected node isn't him.
    effect(() => {
      const stillSubject = this.focusedOnCommunityCvSubject();
      untracked(() => {
        if (!stillSubject) {
          this.showCommunityCv.set(false);
        }
      });
    });
  }

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }

  toggleCommunityCv(): void {
    if (!this.focusedOnCommunityCvSubject()) return;
    this.expandSidebar();
    this.showCommunityCv.update((active) => !active);
  }

  /**
   * Unconditionally opens (never closes) the community-CV takeover, as
   * long as the current selection is Gérôme Grignon. Distinct from
   * `toggleCommunityCv()` — used by the `show_community_cv` WebMCP tool,
   * where "show the highlights" should always end up open, never toggle
   * an already-open panel shut.
   */
  openCommunityCv(): void {
    if (!this.focusedOnCommunityCvSubject()) return;
    this.expandSidebar();
    this.showCommunityCv.set(true);
  }
}
