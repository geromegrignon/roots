import { computed, inject, Injectable, signal } from '@angular/core';
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

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }
}
