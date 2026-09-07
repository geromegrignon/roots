import {
  COLLAPSED_CHILDREN_COUNT,
  HAS_CHILDREN,
  IS_COLLAPSED,
  IS_HIDDEN,
  SORT_ORDER,
  type FamilyTreeBaseNodeData,
} from './interfaces';

type WithFamilyData = { data?: Partial<FamilyTreeBaseNodeData> };

export function getIsCollapsed(part: WithFamilyData) {
  return part.data?.[IS_COLLAPSED];
}

export function getIsHidden(part: WithFamilyData) {
  return part.data?.[IS_HIDDEN];
}

export function getHasChildren(part: WithFamilyData) {
  return part.data?.[HAS_CHILDREN];
}

export function getCollapsedChildrenCount(part: WithFamilyData) {
  return part.data?.[COLLAPSED_CHILDREN_COUNT];
}

export function getSortOrder(part: WithFamilyData) {
  return part.data?.[SORT_ORDER];
}
