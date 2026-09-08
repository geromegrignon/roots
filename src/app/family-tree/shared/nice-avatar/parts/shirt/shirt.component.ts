import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { brighten } from '../../color-utils';
import type { ShirtStyle } from '../../nice-avatar-config';

@Component({
  selector: 'app-nice-avatar-shirt',
  templateUrl: './shirt.component.html',
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
export class NiceAvatarShirtComponent {
  variant = input.required<ShirtStyle>();
  color = input.required<string>();

  /** Lighter accent shade used for the hoody/polo trim. */
  protected readonly lightColor = computed(() => brighten(this.color(), 1));
}
