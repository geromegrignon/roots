import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FamilyTreeSwitcherComponent } from '../family-trees/family-tree-switcher.component';
import { ThemeToggleComponent } from './theme-toggle.component';

@Component({
  selector: 'app-top-navbar',
  imports: [FamilyTreeSwitcherComponent, ThemeToggleComponent],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {}
