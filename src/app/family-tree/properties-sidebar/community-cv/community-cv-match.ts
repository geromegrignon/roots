import { isOccupiedNodeData } from '../../diagram/model/guards';
import { formatFullName, type FamilyTreeNodeData } from '../../diagram/model/interfaces';

/**
 * The one person in the tree this demo/CV feature is wired to: Gérôme
 * Grignon himself (see `diagram/data.ts`, key `g-grignon`, "Gérôme
 * GRIGNON"). Matched by name — accent- and case-insensitive — rather than
 * node id, so it keeps working across family trees and seed edits as long
 * as a node's first + last name still reads "Gérôme Grignon".
 */
function normalizePersonName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const COMMUNITY_CV_SUBJECT_NAME = normalizePersonName('Gerome Grignon');

/** True when `data` is the occupied node for Gérôme Grignon. */
export function isCommunityCvSubject(data: FamilyTreeNodeData | undefined): boolean {
  if (!isOccupiedNodeData(data)) return false;
  return (
    normalizePersonName(formatFullName(data.firstName, data.lastName)) === COMMUNITY_CV_SUBJECT_NAME
  );
}
