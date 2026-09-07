export enum NodeTemplateType {
  FamilyTreeNode = 'familyTreeNode',
}

export enum EdgeTemplateType {
  FamilyTreeEdge = 'familyTreeEdge',
}

export enum Gender {
  Female = 'female',
  Male = 'male',
}

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.Female]: 'Female',
  [Gender.Male]: 'Male',
};

const GENDER_COLORS: Record<Gender, string> = {
  [Gender.Female]: 'var(--ngd-gender-female)',
  [Gender.Male]: 'var(--ngd-gender-male)',
};

export function getColorForGender(gender: Gender | undefined): string | undefined {
  return gender ? GENDER_COLORS[gender] : undefined;
}

/** Renders a person's birth/death years as "1970 – 2020", "b. 1970", or "" if neither is set. */
export function formatLifespan(birthYear?: number, deathYear?: number): string {
  if (birthYear && deathYear) return `${birthYear} – ${deathYear}`;
  if (birthYear) return `b. ${birthYear}`;
  if (deathYear) return `d. ${deathYear}`;
  return '';
}

/** Joins first/last name into a single display string, e.g. for avatar initials. */
export function formatFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export type FamilyTreeNodeData = FamilyTreeOccupiedNodeData | FamilyTreeVacantNodeData;

/**
 * Centralized property keys for family-tree node and edge data.
 *
 * To rename a property, change the key here and in the interface.
 */
export const IS_COLLAPSED = 'isCollapsed' as const;
export const IS_HIDDEN = 'isHidden' as const;
export const HAS_CHILDREN = 'hasChildren' as const;
export const COLLAPSED_CHILDREN_COUNT = 'collapsedChildrenCount' as const;
export const SORT_ORDER = 'sortOrder' as const;
export const EDGE_IS_HIDDEN = 'isHidden' as const;

export interface FamilyTreeEdgeData {
  type: 'familyTree';
  isHidden?: boolean;
}

/**
 * A family-tree node represents one "family unit": a primary person, plus an
 * optional spouse rendered as a second section in the same card. Children
 * hang off this single node exactly like the org-chart template's plain
 * manager -> report edges — there is no separate union/couple node and no
 * second-parent edge. Keeping the underlying graph a strict single-parent
 * tree is deliberate: it's what lets the original ELK tree layout keep
 * working unmodified.
 */
export interface FamilyTreeOccupiedNodeData extends FamilyTreeBaseNodeData {
  type: 'occupied';
  firstName: string;
  lastName?: string;
  gender?: Gender;
  birthYear?: number;
  deathYear?: number;
  /** Spouse fields mirror the primary person's own fields above. */
  spouseFirstName?: string;
  spouseLastName?: string;
  spouseGender?: Gender;
  spouseBirthYear?: number;
  spouseDeathYear?: number;
}

export interface FamilyTreeVacantNodeData extends FamilyTreeBaseNodeData {
  type: 'vacant';
}

export interface FamilyTreeBaseNodeData {
  sortOrder?: number;
  isCollapsed?: boolean;
  collapsedChildrenCount?: number;
  hasChildren?: boolean;
  isHidden?: boolean;
}
