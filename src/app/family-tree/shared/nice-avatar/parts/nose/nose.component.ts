import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NoseStyle } from '../../nice-avatar-config';

@Component({
  selector: 'app-nice-avatar-nose',
  templateUrl: './nose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Renders no box of its own — its <svg> becomes a direct child of the
  // parent's layout (flex/positioning) context, exactly like the original
  // React component which returned the <svg> with no wrapping element.
  // Without this, an unstyled custom-element host collapses to 0x0 (its
  // only child is position:absolute, so it contributes nothing to the
  // host's own box), and inside a flex container that 0x0 box becomes the
  // static-position anchor for the child's own absolute positioning —
  // which is what caused eyebrows/eyes to render outside the avatar circle.
  host: { style: 'display: contents' },
})
export class NiceAvatarNoseComponent {
  variant = input.required<NoseStyle>();
}
