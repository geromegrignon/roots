import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';
import { type FamilyTreeEdgeData, type FamilyTreeNodeData } from './interfaces';

export type NodeUpdate = Omit<Partial<DiagramNode<FamilyTreeNodeData>>, 'data'> & {
  id: string;
  data?: Partial<FamilyTreeNodeData>;
};
export type EdgeUpdate = Omit<Partial<DiagramEdge<FamilyTreeEdgeData>>, 'data'> & {
  id: string;
  data?: Partial<FamilyTreeEdgeData>;
};

/**
 * Accumulates pending model mutations (adds, updates, deletes) that are
 * applied atomically in a single transaction via {@link ModelApplyService}.
 */
export class ModelChanges {
  readonly nodeUpdates: NodeUpdate[] = [];
  readonly edgeUpdates: EdgeUpdate[] = [];
  readonly newNodes: DiagramNode<FamilyTreeNodeData>[] = [];
  readonly newEdges: DiagramEdge<FamilyTreeEdgeData>[] = [];
  readonly deleteNodeIds: string[] = [];
  readonly deleteEdgeIds: string[] = [];

  addNodeUpdates(...updates: NodeUpdate[]): void {
    this.nodeUpdates.push(...updates);
  }

  addEdgeUpdates(...updates: EdgeUpdate[]): void {
    this.edgeUpdates.push(...updates);
  }

  addNewNodes(...nodes: DiagramNode<FamilyTreeNodeData>[]): void {
    this.newNodes.push(...nodes);
  }

  addNewEdges(...edges: DiagramEdge<FamilyTreeEdgeData>[]): void {
    this.newEdges.push(...edges);
  }

  addDeleteNodeIds(...ids: string[]): void {
    this.deleteNodeIds.push(...ids);
  }

  addDeleteEdgeIds(...ids: string[]): void {
    this.deleteEdgeIds.push(...ids);
  }
}
