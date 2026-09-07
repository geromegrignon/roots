import { type Edge, type Node } from 'ng-diagram';
import { Gender, type FamilyTreeEdgeData, type FamilyTreeNodeData } from './model/interfaces';

/**
 * Seed data: descendants of François Joachim GRIGNON, transcribed from a
 * hand-drawn genealogy chart. A few simplifications were necessary because
 * this app's node model allows one recorded spouse per person:
 *
 * - Where the source chart showed two successive marriages for one person,
 *   only the marriage with descendants shown under it is recorded as the
 *   node's spouse; any children from the other marriage are still attached
 *   as that person's children (a node's children hang off the person, not
 *   off a specific marriage).
 * - François Joachim GRIGNON's first marriage (&1825, to Françoise Jeanne
 *   CÉLO, no descendants shown) isn't represented — only the second
 *   marriage (&1829, to Sainte Marguerite PERROIS), from which the rest of
 *   the chart descends.
 * - Where the chart gave only an initial for a name, gender is left
 *   unset (it only drives avatar color) rather than guessed.
 *
 * The bottom-most generation (the smallest print on the source chart) was
 * the hardest to read with full confidence — worth double-checking against
 * the original chart.
 */
interface PersonSpec {
  key: string;
  parentKey: string | null;
  firstName: string;
  lastName?: string;
  gender?: Gender;
  birthYear?: number;
  deathYear?: number;
  spouseFirstName?: string;
  spouseLastName?: string;
  spouseGender?: Gender;
  spouseBirthYear?: number;
  spouseDeathYear?: number;
}

const PEOPLE: PersonSpec[] = [
  // Generation 1
  {
    key: 'francois-joachim',
    parentKey: null,
    firstName: 'François Joachim',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1797,
    deathYear: 1868,
    spouseFirstName: 'Sainte Marguerite',
    spouseLastName: 'PERROIS',
    spouseGender: Gender.Female,
    spouseBirthYear: 1806,
    spouseDeathYear: 1878,
  },
  // Generation 2
  {
    key: 'julien-lucien',
    parentKey: 'francois-joachim',
    firstName: 'Julien Lucien',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1840,
    deathYear: 1904,
    spouseFirstName: 'Anne Marie Joséphine',
    spouseLastName: 'CHASLOT',
    spouseGender: Gender.Female,
    spouseBirthYear: 1847,
    spouseDeathYear: 1908,
  },
  // Generation 3
  {
    key: 'pierre-joseph',
    parentKey: 'julien-lucien',
    firstName: 'Pierre Joseph',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1881,
    deathYear: 1964,
    spouseFirstName: 'Marie Eléonore',
    spouseLastName: 'CORBONNOIS',
    spouseGender: Gender.Female,
    spouseBirthYear: 1889,
    spouseDeathYear: 1972,
  },
  // Generation 4 - six children of Pierre Joseph & Marie Eléonore
  {
    key: 'pierre-marie-joseph',
    parentKey: 'pierre-joseph',
    firstName: 'Pierre Marie Joseph',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1911,
    deathYear: 1954,
  },
  {
    key: 'marie-augustine-berthe',
    parentKey: 'pierre-joseph',
    firstName: 'Marie Augustine Berthe',
    lastName: 'GRIGNON',
    gender: Gender.Female,
    birthYear: 1912,
    deathYear: 2001,
    spouseFirstName: 'Joseph Pierre Jean Marie',
    spouseLastName: 'PAILLARD',
    spouseGender: Gender.Male,
    spouseBirthYear: 1909,
    spouseDeathYear: 1982,
  },
  {
    key: 'raymond-lucien-joseph',
    parentKey: 'pierre-joseph',
    firstName: 'Raymond Lucien Joseph',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1914,
    deathYear: 1990,
    // Second marriage (&1950, to Louise Marie Marguerite Renée LOISEAU,
    // 1917-1998) not recorded here - no descendants were shown under it.
    spouseFirstName: 'Marie Josèphe Augustine',
    spouseLastName: 'CHEVALIER',
    spouseGender: Gender.Female,
    spouseBirthYear: 1918,
    spouseDeathYear: 1939,
  },
  {
    key: 'charles-jean-auguste',
    parentKey: 'pierre-joseph',
    firstName: 'Charles Jean Auguste',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1919,
    deathYear: 2013,
    spouseFirstName: 'Juliette Adélaïde Marie Joseph',
    spouseLastName: 'BOUGEARD',
    spouseGender: Gender.Female,
    spouseBirthYear: 1921,
    spouseDeathYear: 2004,
  },
  {
    key: 'jean-emile-pierre',
    parentKey: 'pierre-joseph',
    firstName: 'Jean Émile Pierre',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    birthYear: 1925,
    deathYear: 2017,
  },
  {
    key: 'a-grignon-gen4',
    parentKey: 'pierre-joseph',
    firstName: 'A.',
    lastName: 'GRIGNON',
  },

  // Generation 5
  {
    key: 'r-grignon',
    parentKey: 'raymond-lucien-joseph',
    firstName: 'R.',
    lastName: 'GRIGNON',
    spouseFirstName: 'Marie Thérèse',
    spouseLastName: 'LOISEL',
  },
  {
    key: 'charles-grignon-gen5',
    parentKey: 'charles-jean-auguste',
    firstName: 'Charles',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    spouseFirstName: 'Françoise',
    spouseLastName: 'LANDRIEU',
    spouseGender: Gender.Female,
  },
  {
    key: 'michel-grignon',
    parentKey: 'charles-jean-auguste',
    firstName: 'Michel',
    lastName: 'GRIGNON',
    gender: Gender.Male,
    spouseFirstName: 'M.',
    spouseLastName: 'ROBLIN',
  },

  // Generation 6
  {
    key: 'c-grignon-bourdon',
    parentKey: 'r-grignon',
    firstName: 'C.',
    lastName: 'GRIGNON',
    spouseFirstName: 'P.',
    spouseLastName: 'BOURDON',
  },
  {
    key: 'a-grignon-lecoq',
    parentKey: 'r-grignon',
    firstName: 'A.',
    lastName: 'GRIGNON',
    spouseFirstName: 'F.',
    spouseLastName: 'LECOQ',
  },
  {
    key: 'p-grignon-gen6',
    parentKey: 'r-grignon',
    firstName: 'P.',
    lastName: 'GRIGNON',
  },
  {
    key: 'l-grignon-roux',
    parentKey: 'charles-grignon-gen5',
    firstName: 'L.',
    lastName: 'GRIGNON',
    // Second marriage noted on the chart (to P. LEMESLE) not recorded as
    // spouse here, but a child from it is still attached below.
    spouseFirstName: 'J.',
    spouseLastName: 'ROUX',
  },
  {
    key: 'i-grignon-efimoff',
    parentKey: 'charles-grignon-gen5',
    firstName: 'I.',
    lastName: 'GRIGNON',
    spouseFirstName: 'B.',
    spouseLastName: 'EFIMOFF',
  },
  {
    key: 'v-grignon-breste',
    parentKey: 'charles-grignon-gen5',
    firstName: 'V.',
    lastName: 'GRIGNON',
    spouseFirstName: 'M.',
    spouseLastName: 'BRESTE',
  },
  {
    key: 'g-grignon',
    parentKey: 'michel-grignon',
    firstName: 'G.',
    lastName: 'GRIGNON',
  },
  {
    key: 'a-grignon-gen6',
    parentKey: 'michel-grignon',
    firstName: 'A.',
    lastName: 'GRIGNON',
    // Spouse shown on the chart only as "? ?" - left unset.
  },
  {
    key: 'e-grignon',
    parentKey: 'michel-grignon',
    firstName: 'E.',
    lastName: 'GRIGNON',
  },

  // Generation 7
  { key: 'f-bourdon', parentKey: 'c-grignon-bourdon', firstName: 'F.', lastName: 'BOURDON' },
  { key: 'a-bourdon', parentKey: 'c-grignon-bourdon', firstName: 'A.', lastName: 'BOURDON' },
  { key: 'p-bourdon', parentKey: 'c-grignon-bourdon', firstName: 'P.', lastName: 'BOURDON' },
  { key: 'm-lecoq', parentKey: 'a-grignon-lecoq', firstName: 'M.', lastName: 'LECOQ' },
  { key: 'p-lecoq', parentKey: 'a-grignon-lecoq', firstName: 'P.', lastName: 'LECOQ' },
  { key: 'c-lecoq', parentKey: 'a-grignon-lecoq', firstName: 'C.', lastName: 'LECOQ' },
  { key: 'a-lecoq', parentKey: 'a-grignon-lecoq', firstName: 'A.', lastName: 'LECOQ' },
  { key: 'c-roux', parentKey: 'l-grignon-roux', firstName: 'C.', lastName: 'ROUX' },
  { key: 't-roux', parentKey: 'l-grignon-roux', firstName: 'T.', lastName: 'ROUX' },
  { key: 'c-lemesle', parentKey: 'l-grignon-roux', firstName: 'C.', lastName: 'LEMESLE' },
  { key: 't-efimoff', parentKey: 'i-grignon-efimoff', firstName: 'T.', lastName: 'EFIMOFF' },
  { key: 'm-efimoff', parentKey: 'i-grignon-efimoff', firstName: 'M.', lastName: 'EFIMOFF' },
  { key: 'm-grignon-gen7', parentKey: 'v-grignon-breste', firstName: 'M.', lastName: 'GRIGNON' },
  { key: 'a-grignon-gen7', parentKey: 'a-grignon-gen6', firstName: 'A.', lastName: 'GRIGNON' },
];

function hasChildren(key: string): boolean {
  return PEOPLE.some((p) => p.parentKey === key);
}

function toNode(person: PersonSpec): Node<FamilyTreeNodeData> {
  return {
    id: person.key,
    position: { x: 0, y: 0 },
    type: 'familyTreeNode',
    data: {
      type: 'occupied',
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      spouseFirstName: person.spouseFirstName,
      spouseLastName: person.spouseLastName,
      spouseGender: person.spouseGender,
      spouseBirthYear: person.spouseBirthYear,
      spouseDeathYear: person.spouseDeathYear,
      ...(hasChildren(person.key) ? { isCollapsed: false, hasChildren: true } : {}),
    },
  };
}

function toEdge(person: PersonSpec): Edge<FamilyTreeEdgeData> | null {
  if (!person.parentKey) return null;
  return {
    id: `edge-${person.parentKey}-${person.key}`,
    source: person.parentKey,
    sourcePort: 'port-out',
    target: person.key,
    targetPort: 'port-in',
    type: 'familyTreeEdge',
    data: { type: 'familyTree' },
  };
}

export const diagramModel: {
  nodes: Node<FamilyTreeNodeData>[];
  edges: Edge<FamilyTreeEdgeData>[];
} = {
  nodes: PEOPLE.map(toNode),
  edges: PEOPLE.map(toEdge).filter((edge): edge is Edge<FamilyTreeEdgeData> => edge !== null),
};
