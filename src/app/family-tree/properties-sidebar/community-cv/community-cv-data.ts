/**
 * Content for the community-CV takeover panel (see
 * `community-cv-panel.component.ts`): a small, deliberately short list of
 * highlights — just enough to read at a glance during a conference-talk
 * live demo.
 *
 * `iconSrc` points at `public/optimus-ui.svg` for all four entries right
 * now — a temporary placeholder (per Gérôme, 2026-09-10) using the one
 * logo file he's dropped in `public/` so far. Swap in a distinct icon per
 * highlight under `public/` (or `src/assets/`) as they become available.
 */

export interface CommunityCvHighlight {
  readonly title: string;
  readonly iconSrc: string;
}

export const COMMUNITY_CV_HIGHLIGHTS: readonly CommunityCvHighlight[] = [
  { title: 'Optimus UI', iconSrc: 'optimus-ui.svg' },
  { title: 'Discord Admin', iconSrc: 'optimus-ui.svg' },
  { title: 'Angular Can I Use', iconSrc: 'optimus-ui.svg' },
  { title: 'NG Baguette Conf', iconSrc: 'optimus-ui.svg' },
];
