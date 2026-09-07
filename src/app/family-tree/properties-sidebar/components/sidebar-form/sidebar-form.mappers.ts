import { InjectionToken } from '@angular/core';
import { isOccupiedNodeData } from '../../../diagram/model/guards';
import { type FamilyTreeNodeData, type Gender } from '../../../diagram/model/interfaces';

export interface SidebarFieldChange {
  nodeId: string;
  fields: (keyof SidebarFormData)[];
  formData: SidebarFormData;
}

export const ON_FIELD_CHANGE = new InjectionToken<(change: SidebarFieldChange) => void>(
  'ON_FIELD_CHANGE',
);

export interface SidebarFormData {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  birthYear: number | null;
  deathYear: number | null;
  spouseFirstName: string;
  spouseLastName: string;
  spouseGender: Gender | null;
  spouseBirthYear: number | null;
  spouseDeathYear: number | null;
  parentId: string | null;
}

export const EMPTY_FORM: SidebarFormData = {
  firstName: '',
  lastName: '',
  gender: null,
  birthYear: null,
  deathYear: null,
  spouseFirstName: '',
  spouseLastName: '',
  spouseGender: null,
  spouseBirthYear: null,
  spouseDeathYear: null,
  parentId: null,
};

export function nodeDataToFormData(
  data: FamilyTreeNodeData,
  parentId: string | null,
): SidebarFormData {
  const occupied = isOccupiedNodeData(data) ? data : undefined;
  return {
    firstName: occupied?.firstName ?? '',
    lastName: occupied?.lastName ?? '',
    gender: occupied?.gender ?? null,
    birthYear: occupied?.birthYear ?? null,
    deathYear: occupied?.deathYear ?? null,
    spouseFirstName: occupied?.spouseFirstName ?? '',
    spouseLastName: occupied?.spouseLastName ?? '',
    spouseGender: occupied?.spouseGender ?? null,
    spouseBirthYear: occupied?.spouseBirthYear ?? null,
    spouseDeathYear: occupied?.spouseDeathYear ?? null,
    parentId,
  };
}

/**
 * Rebuilds node data from form input. `existingData` is a union (occupied
 * vs. vacant) so its variant-only fields (firstName, gender, spouse* ...)
 * can't be destructured directly — only the base fields shared by both
 * variants are carried over, and the rest is rebuilt fresh from the form.
 */
export function formDataToNodeData(
  formData: SidebarFormData,
  existingData: FamilyTreeNodeData,
): FamilyTreeNodeData {
  const base = {
    sortOrder: existingData.sortOrder,
    isCollapsed: existingData.isCollapsed,
    collapsedChildrenCount: existingData.collapsedChildrenCount,
    hasChildren: existingData.hasChildren,
    isHidden: existingData.isHidden,
  };

  if (!formData.firstName) {
    return { ...base, type: 'vacant' };
  }

  return {
    ...base,
    type: 'occupied',
    firstName: formData.firstName,
    lastName: formData.lastName || undefined,
    gender: formData.gender ?? undefined,
    birthYear: formData.birthYear ?? undefined,
    deathYear: formData.deathYear ?? undefined,
    spouseFirstName: formData.spouseFirstName || undefined,
    spouseLastName: formData.spouseLastName || undefined,
    spouseGender: formData.spouseGender ?? undefined,
    spouseBirthYear: formData.spouseBirthYear ?? undefined,
    spouseDeathYear: formData.spouseDeathYear ?? undefined,
  };
}
