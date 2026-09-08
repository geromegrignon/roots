import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { genConfig, type Sex } from './nice-avatar-config';
import { NiceAvatarEarComponent } from './parts/ear/ear.component';
import { NiceAvatarEyebrowComponent } from './parts/eyebrow/eyebrow.component';
import { NiceAvatarEyesComponent } from './parts/eyes/eyes.component';
import { NiceAvatarFaceComponent } from './parts/face/face.component';
import { NiceAvatarGlassesComponent } from './parts/glasses/glasses.component';
import { NiceAvatarHairComponent } from './parts/hair/hair.component';
import { NiceAvatarMouthComponent } from './parts/mouth/mouth.component';
import { NiceAvatarNoseComponent } from './parts/nose/nose.component';
import { NiceAvatarShirtComponent } from './parts/shirt/shirt.component';

let nextInstanceId = 0;

/**
 * Cartoon avatar generated deterministically from a `seed` string (e.g. a
 * person's id or name), ported from the `react-nice-avatar` React library
 * (https://github.com/dansnow/react-nice-avatar) to a standalone Angular
 * component. Every part (face, hair, eyes, ...) is picked by hashing the
 * seed, so the same seed always renders the same avatar and each person can
 * keep a stable, recognizable avatar instead of a plain initials circle.
 *
 * Pass `sex` when the caller knows the person's actual gender, to limit
 * the hairstyle/eyebrow preset pool to the matching one instead of
 * letting it fall out of the seed hash (see {@link genConfig}).
 *
 * Usage: `<app-nice-avatar [seed]="person.id" [sex]="'woman'" size="md" />`
 */
@Component({
  selector: 'app-nice-avatar',
  imports: [
    NiceAvatarFaceComponent,
    NiceAvatarHairComponent,
    NiceAvatarEyebrowComponent,
    NiceAvatarEyesComponent,
    NiceAvatarGlassesComponent,
    NiceAvatarEarComponent,
    NiceAvatarNoseComponent,
    NiceAvatarMouthComponent,
    NiceAvatarShirtComponent,
  ],
  templateUrl: './nice-avatar.component.html',
  styleUrl: './nice-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.size-md]': 'size() === "md"',
    '[class.size-xl]': 'size() === "xl"',
    '[style.overflow]': "'hidden'",
    '[style.border-radius]': 'borderRadius()',
    '[style.background]': 'config().bgColor',
  },
})
export class NiceAvatarComponent {
  /** Stable identifier (person id, full name, ...) the whole appearance is derived from. */
  seed = input.required<string>();
  shape = input<'circle' | 'rounded' | 'square'>('circle');
  size = input<'md' | 'xl'>('xl');
  /** When true, the thick hair style uses `config().hairColor` instead of a near-black tone. */
  hairColorRandom = input(false);
  /** Pins the hairstyle/eyebrow preset pool; omit to let it fall out of the seed hash. */
  sex = input<Sex>();

  /** Unique per-instance id, used to namespace SVG mask ids so multiple avatars on one page don't clash. */
  protected readonly uid = `nice-avatar-${nextInstanceId++}`;

  protected readonly config = computed(() => genConfig(this.seed(), this.sex()));

  protected readonly borderRadius = computed(() => {
    switch (this.shape()) {
      case 'rounded':
        return '6px';
      case 'square':
        return '0';
      case 'circle':
      default:
        return '100%';
    }
  });
}
