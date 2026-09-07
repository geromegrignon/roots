import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InitialsAvatarComponent } from '../../../../shared/initials-avatar/initials-avatar.component';

@Component({
  selector: 'app-node-header',
  imports: [InitialsAvatarComponent],
  templateUrl: './node-header.component.html',
  styleUrls: ['./node-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'node-header' },
})
export class NodeHeaderComponent {
  fullName = input<string>();
  /** Secondary line under the name — this card's lifespan (e.g. "1970 – 2020"). */
  subtitle = input<string>();
  color = input<string>();
  vacant = input(false);
  avatarSize = input<'md' | 'xl'>('xl');

  displayName = computed(() => (this.vacant() ? 'Unnamed Person' : (this.fullName() ?? '')));
}
