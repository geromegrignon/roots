import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, type Edge, type Node } from 'ng-diagram';
import { getIsCollapsed } from './data-getters';
import { ExpandCollapseService } from './expand-collapse.service';
import { HierarchyService } from './hierarchy.service';
import {
  COLLAPSED_CHILDREN_COUNT,
  EdgeTemplateType,
  HAS_CHILDREN,
  IS_COLLAPSED,
  NodeTemplateType,
  SORT_ORDER,
  type FamilyTreeEdgeData,
  type FamilyTreeNodeData,
  type FamilyTreeVacantNodeData,
} from './interfaces';
import { ModelApplyService } from './model-apply.service';
import { ModelChanges } from './model-changes';
import { SortOrderService } from './sort-order.service';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

@Injectable()
export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly hierarchyService = inject(HierarchyService);

  /**
   * Adds a new vacant node as a child or sibling of the given node.
   * Computes sort order, expands the parent if collapsed, re-layouts, and selects the new node.
   *
   * @param nodeId - The reference node to add relative to.
   * @param action - Whether to add as `child`, `siblingBefore`, or `siblingAfter`.
   * @returns The new node's ID, or `undefined` if the operation was skipped.
   */
  async addNode(nodeId: string, action: AddNodeAction): Promise<string | undefined> {
    const { parentId, referenceNodeId, position } = this.resolveParams(nodeId, action);
    if (!parentId) return undefined;

    const parentNode = this.modelService.getNodeById<FamilyTreeNodeData>(parentId);
    if (!parentNode) return undefined;

    const needsExpand = action === 'child' && !!getIsCollapsed(parentNode);
    const newNodeId = crypto.randomUUID();

    const { changes, sortOrders } = this.sortOrderService.reorderChildren(parentId, [
      { nodeId: newNodeId, referenceId: referenceNodeId, position },
    ]);

    changes.addNewNodes(this.createVacantNode(newNodeId, sortOrders[newNodeId]));
    changes.addNewEdges(this.createEdge(parentId, newNodeId));

    const expandSubtreeIds = this.updateParentNode(parentNode, needsExpand, changes);

    await this.modelApplyService.applyWithLayout(changes, {
      visibility: expandSubtreeIds
        ? { subtreeIds: expandSubtreeIds, collapsing: false }
        : undefined,
    });

    return newNodeId;
  }

  /** Resolves the parent ID, reference node, and insertion position for the given action. */
  private resolveParams(
    nodeId: string,
    action: AddNodeAction,
  ): {
    parentId: string | null;
    referenceNodeId: string | null;
    position: 'before' | 'after';
  } {
    if (action === 'child') {
      return { parentId: nodeId, referenceNodeId: null, position: 'after' };
    }
    return {
      parentId: this.hierarchyService.getParentId(nodeId),
      referenceNodeId: nodeId,
      position: action === 'siblingBefore' ? 'before' : 'after',
    };
  }

  /**
   * Updates the parent node's data (`hasChildren`) and expands its subtree if needed.
   * Appends expand visibility changes first, then the parent data update (which takes precedence).
   *
   * @returns The set of subtree IDs affected by the expand, or `undefined` if no expand was needed.
   */
  private updateParentNode(
    parentNode: Node<FamilyTreeNodeData>,
    needsExpand: boolean,
    changes: ModelChanges,
  ): Set<string> | undefined {
    let expandSubtreeIds: Set<string> | undefined;

    if (needsExpand) {
      expandSubtreeIds = this.expandCollapseService.prepareToggle(
        parentNode.id,
        changes,
      )?.toggledSubtreeIds;
    }

    changes.addNodeUpdates({
      id: parentNode.id,
      data: {
        [HAS_CHILDREN]: true,
        ...(needsExpand ? { [IS_COLLAPSED]: false, [COLLAPSED_CHILDREN_COUNT]: undefined } : {}),
      },
    });

    return expandSubtreeIds;
  }

  /** Creates a new vacant node with the given sort order. */
  private createVacantNode(id: string, sortOrder: number): Node<FamilyTreeVacantNodeData> {
    return {
      id,
      type: NodeTemplateType.FamilyTreeNode,
      position: { x: 0, y: 0 },
      data: {
        type: 'vacant',
        [SORT_ORDER]: sortOrder,
        [IS_COLLAPSED]: false,
        [HAS_CHILDREN]: false,
      },
    };
  }

  /** Creates a family-tree edge connecting a parent to a child node. */
  private createEdge(parentId: string, childId: string): Edge<FamilyTreeEdgeData> {
    return {
      id: crypto.randomUUID(),
      source: parentId,
      sourcePort: 'port-out',
      target: childId,
      targetPort: 'port-in',
      type: EdgeTemplateType.FamilyTreeEdge,
      data: { type: 'familyTree' },
    };
  }
}
