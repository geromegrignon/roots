/**
 * Avatar appearance generation, ported from the `react-nice-avatar` library
 * (https://github.com/dansnow/react-nice-avatar) to plain TypeScript so it
 * can drive the Angular {@link NiceAvatarComponent} instead of a React tree.
 *
 * The generation algorithm itself (hashing, weighted random picks) is kept
 * as close to the original as possible so avatars generated from the same
 * seed look the same as upstream.
 *
 * Context: this app is a family-tree viewer built for Gerome to showcase his
 * own family on a display at a conference hall. Because every avatar shown
 * belongs to that one family, `defaultOptions.faceColor` below is deliberately
 * limited to a single light/"white" skin tone rather than the fuller palette
 * the original library supports — see the comment on that field.
 */

export type Sex = 'man' | 'woman';
export type EarSize = 'small' | 'big';
export type HairStyleMan = 'normal' | 'thick';
export type HairStyleWoman = 'normal' | 'womanLong' | 'womanShort';
export type HairStyle = HairStyleMan | HairStyleWoman;
export type EyeStyle = 'circle' | 'oval' | 'smile';
export type GlassesStyle = 'round' | 'square' | 'none';
export type NoseStyle = 'short' | 'long' | 'round';
export type MouthStyle = 'laugh' | 'smile' | 'peace';
export type ShirtStyle = 'hoody' | 'short' | 'polo';
export type EyeBrowStyle = 'up' | 'upWoman';

export interface AvatarConfig {
  sex?: Sex;
  faceColor?: string;
  earSize?: EarSize;
  hairColor?: string;
  hairStyle?: HairStyle;
  eyeStyle?: EyeStyle;
  glassesStyle?: GlassesStyle;
  noseStyle?: NoseStyle;
  mouthStyle?: MouthStyle;
  shirtStyle?: ShirtStyle;
  shirtColor?: string;
  bgColor?: string;
  isGradient?: boolean;
}

export interface AvatarFullConfig extends AvatarConfig {
  eyeBrowStyle?: EyeBrowStyle;
}

/** The fully-resolved config every field of which is guaranteed to be set. */
export type ResolvedAvatarConfig = Required<AvatarFullConfig>;

interface DefaultOptions {
  sex: Sex[];
  faceColor: string[];
  earSize: EarSize[];
  hairColor: string[];
  hairStyleMan: HairStyleMan[];
  hairStyleWoman: HairStyleWoman[];
  eyeBrowWoman: EyeBrowStyle[];
  eyeStyle: EyeStyle[];
  glassesStyle: GlassesStyle[];
  noseStyle: NoseStyle[];
  mouthStyle: MouthStyle[];
  shirtStyle: ShirtStyle[];
  shirtColor: string[];
  bgColor: string[];
  gradientBgColor: string[];
}

export const defaultOptions: DefaultOptions = {
  sex: ['man', 'woman'],
  // Limited to a single light/"white" skin tone: this app is scoped to
  // showcasing Gerome's family at a conference hall, so the multi-tone
  // palette from the original library isn't needed here.
  faceColor: ['#F9C9B6'],
  earSize: ['small', 'big'],
  // Natural/traditional hair colors only (no fantasy pinks or blues from
  // the original library's palette), matching the same real-family framing
  // as the `faceColor` restriction above.
  hairColor: [
    '#090806', // black
    '#2C1B18', // dark brown
    '#4E3629', // brown
    '#A67B5B', // light brown / chestnut
    '#E6BE8A', // blonde
    '#922724', // auburn / red
    '#B8B8B8', // gray
  ],
  hairStyleMan: ['normal', 'thick'],
  hairStyleWoman: ['normal', 'womanLong', 'womanShort'],
  eyeBrowWoman: ['up', 'upWoman'],
  eyeStyle: ['circle', 'oval', 'smile'],
  glassesStyle: ['round', 'square', 'none'],
  noseStyle: ['short', 'long', 'round'],
  mouthStyle: ['laugh', 'smile', 'peace'],
  shirtStyle: ['hoody', 'short', 'polo'],
  shirtColor: ['#9287FF', '#6BD9E9', '#FC909F', '#F4D150', '#77311D'],
  bgColor: [
    '#9287FF',
    '#6BD9E9',
    '#FC909F',
    '#F4D150',
    '#E0DDFF',
    '#D2EFF3',
    '#FFEDEF',
    '#FFEBA4',
    '#506AF4',
    '#F48150',
    '#74D153',
  ],
  gradientBgColor: [
    'linear-gradient(45deg, #178bff 0%, #ff6868 100%)',
    'linear-gradient(45deg, #176fff 0%, #68ffef 100%)',
    'linear-gradient(45deg, #ff1717 0%, #ffd368 100%)',
    'linear-gradient(90deg, #36cd1c 0%, #68deff 100%)',
    'linear-gradient(45deg, #3e1ccd 0%, #ff6871 100%)',
    'linear-gradient(45deg, #1729ff 0%, #ff56f7 100%)',
    'linear-gradient(45deg, #56b5f0 0%, #45ccb5 100%)',
  ],
};

function stringToHashCode(str: string): number {
  if (str.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

interface PickByHashCodeOpts {
  avoidList?: string[];
  usually?: string[];
}

function pickByHashCode(
  code: number,
  type: keyof DefaultOptions,
  opts?: PickByHashCodeOpts,
): string {
  const avoidList = opts?.avoidList ?? [];
  const usually = opts?.usually ?? [];

  const avoidSet = new Set<string>(avoidList);
  const filtered = defaultOptions[type].filter((item) => !avoidSet.has(item));

  const weighted = usually
    .filter(Boolean)
    .reduce<string[]>((acc, cur) => acc.concat(new Array(15).fill(cur)), [])
    .concat(filtered);

  const index = code % weighted.length;
  return weighted[index];
}

/**
 * Deterministically derives a full avatar configuration from a seed string
 * (e.g. a person's id or name). The same seed always resolves to the same
 * appearance, which is what lets each person keep a stable avatar across
 * re-renders instead of a new random face every time.
 *
 * `sex` pins which preset pool the generated appearance draws from (see the
 * `hairStyleMan`/`hairStyleWoman` and eyebrow branches below) instead of
 * letting it fall out of the seed hash — pass it when the caller knows the
 * person's actual gender, so hairstyle/eyebrow options stay limited to the
 * matching preset. Every other feature (face, eyes, nose, mouth, glasses,
 * shirt, colors, ...) is unaffected by `sex` and stays purely seed-derived.
 */
export function genConfig(seed: string, sex?: Sex): ResolvedAvatarConfig {
  const hashCode = stringToHashCode(seed);
  const response = {} as ResolvedAvatarConfig;

  response.sex = sex ?? (pickByHashCode(hashCode, 'sex') as Sex);
  response.faceColor = pickByHashCode(hashCode, 'faceColor');
  response.earSize = pickByHashCode(hashCode, 'earSize') as EarSize;
  response.eyeStyle = pickByHashCode(hashCode, 'eyeStyle') as EyeStyle;
  response.noseStyle = pickByHashCode(hashCode, 'noseStyle') as NoseStyle;
  response.mouthStyle = pickByHashCode(hashCode, 'mouthStyle') as MouthStyle;
  response.shirtStyle = pickByHashCode(hashCode, 'shirtStyle') as ShirtStyle;
  response.glassesStyle = pickByHashCode(hashCode, 'glassesStyle', {
    usually: ['none'],
  }) as GlassesStyle;

  // Hair color: men usually default to black hair. (The original library
  // also steered women with the darker "brown" face color away from a
  // clashing hair color, but that face-color option no longer exists here —
  // see `defaultOptions.faceColor` above — so that avoidance no longer applies.)
  const hairColorUsually = response.sex === 'man' ? ['#000'] : [];
  response.hairColor = pickByHashCode(hashCode, 'hairColor', {
    usually: hairColorUsually,
  });

  response.hairStyle =
    response.sex === 'man'
      ? (pickByHashCode(hashCode, 'hairStyleMan', { usually: ['normal', 'thick'] }) as HairStyleMan)
      : (pickByHashCode(hashCode, 'hairStyleWoman') as HairStyleWoman);

  response.eyeBrowStyle =
    response.sex === 'woman' ? (pickByHashCode(hashCode, 'eyeBrowWoman') as EyeBrowStyle) : 'up';

  response.shirtColor = pickByHashCode(hashCode, 'shirtColor', { avoidList: [response.hairColor] });
  response.bgColor = pickByHashCode(hashCode, 'bgColor', {
    avoidList: [response.hairColor, response.shirtColor],
  });
  response.isGradient = false;

  return response;
}
