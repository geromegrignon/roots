import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-sidebar-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-header.component.html',
  styleUrl: './sidebar-header.component.scss',
})
export class SidebarHeaderComponent {
  isExpanded = input.required<boolean>();
  /** Only true while the selected node is Gérôme Grignon — shows the star toggle. */
  showCommunityCvButton = input(false);
  toggle = output<void>();
  communityCvToggle = output<void>();
}
