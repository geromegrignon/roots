import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NiceAvatarComponent } from '../../../../shared/nice-avatar/nice-avatar.component';
import { InitialsAvatarComponent } from '../../../../shared/initials-avatar/initials-avatar.component';
import { getAvatarSexForGender, type Gender } from '../../../model/interfaces';

@Component({
  selector: 'app-node-header',
  imports: [NiceAvatarComponent, InitialsAvatarComponent],
  templateUrl: './node-header.component.html',
  styleUrls: ['./node-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'node-header' },
})
export class NodeHeaderComponent {
  fullName = input<string>();
  /** Secondary line under the name — this card's lifespan (e.g. "1970 – 2020"). */
  subtitle = input<string>();
  /** Limits the generated avatar's hairstyle/eyebrow preset pool to match. */
  gender = input<Gender>();
  vacant = input(false);
  avatarSize = input<'md' | 'xl'>('xl');

  displayName = computed(() => (this.vacant() ? 'Unnamed Person' : (this.fullName() ?? '')));
  protected readonly avatarSex = computed(() => getAvatarSexForGender(this.gender()));
}
