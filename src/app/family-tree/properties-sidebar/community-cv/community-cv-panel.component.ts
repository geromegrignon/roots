import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { NiceAvatarComponent } from '../../shared/nice-avatar/nice-avatar.component';
import { COMMUNITY_CV_HIGHLIGHTS } from './community-cv-data';

/**
 * Full-viewport takeover shown in place of the properties sidebar when the
 * star toggle in `SidebarHeaderComponent` is clicked while Gérôme Grignon
 * is the selected node (see `PropertiesSidebarService.isCommunityCvActive`).
 * Deliberately minimal: identity in the corner, a 2x2 grid of icon+title
 * cards as the only content — built as a conference-talk live-demo moment.
 */
@Component({
  selector: 'app-community-cv-panel',
  imports: [NiceAvatarComponent],
  templateUrl: './community-cv-panel.component.html',
  styleUrl: './community-cv-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityCvPanelComponent {
  close = output<void>();

  protected readonly highlights = COMMUNITY_CV_HIGHLIGHTS;
}
