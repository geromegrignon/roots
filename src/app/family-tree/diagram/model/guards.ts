import { type Edge, type Node } from 'ng-diagram';
import {
  FamilyTreeEdgeData,
  type FamilyTreeNodeData,
  type FamilyTreeOccupiedNodeData,
  type FamilyTreeVacantNodeData,
} from './interfaces';

export function isFamilyTreeNodeData(data: unknown): data is FamilyTreeNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data.type === 'occupied' || data.type === 'vacant')
  );
}

export function isOccupiedNodeData(data: unknown): data is FamilyTreeOccupiedNodeData {
  return isFamilyTreeNodeData(data) && data.type === 'occupied';
}

export function isVacantNodeData(data: unknown): data is FamilyTreeVacantNodeData {
  return isFamilyTreeNodeData(data) && data.type === 'vacant';
}

export function isFamilyTreeNode(node: Node | null | undefined): node is Node<FamilyTreeNodeData> {
  return !!node && isFamilyTreeNodeData(node.data);
}

export function isOccupiedNode(
  node: Node | null | undefined,
): node is Node<FamilyTreeOccupiedNodeData> {
  return !!node && isOccupiedNodeData(node.data);
}

export function isVacantNode(node: Node | null | undefined): node is Node<FamilyTreeVacantNodeData> {
  return !!node && isVacantNodeData(node.data);
}

export function isFamilyTreeEdgeData(data: unknown): data is FamilyTreeEdgeData {
  return typeof data === 'object' && data !== null && 'type' in data && data.type === 'familyTree';
}

export function isFamilyTreeEdge(edge: Edge | null | undefined): edge is Edge<FamilyTreeEdgeData> {
  return !!edge && isFamilyTreeEdgeData(edge.data);
}
