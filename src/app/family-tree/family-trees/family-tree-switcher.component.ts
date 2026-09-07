import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AddFamilyTreeModalComponent } from './add-family-tree-modal.component';
import { ADD_NEW_FAMILY_TREE_VALUE, FamilyTreeStoreService } from './family-tree-store.service';

/**
 * Left-of-the-theme-switcher control for choosing which family tree is
 * shown, and for creating new ones via the "Add new family tree" option.
 */
@Component({
  selector: 'app-family-tree-switcher',
  imports: [AddFamilyTreeModalComponent],
  templateUrl: './family-tree-switcher.component.html',
  styleUrl: './family-tree-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class FamilyTreeSwitcherComponent {
  protected readonly store = inject(FamilyTreeStoreService);

  protected readonly ADD_NEW_FAMILY_TREE_VALUE = ADD_NEW_FAMILY_TREE_VALUE;
  protected readonly isAddModalOpen = signal(false);

  /**
   * Handles a select change. Picking the "add new" option opens the modal
   * instead of switching trees, and reverts the select's visible value back
   * to the active tree (the browser has already moved the native selection
   * to that option by the time `change` fires).
   */
  protected onChange(event: Event, selectEl: HTMLSelectElement): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === ADD_NEW_FAMILY_TREE_VALUE) {
      selectEl.value = this.store.activeTreeId();
      this.isAddModalOpen.set(true);
      return;
    }

    this.store.setActiveTree(value);
  }

  protected closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }
}
