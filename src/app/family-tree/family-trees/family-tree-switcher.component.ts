import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from '@openng/optimus-ui/select';
import { type SelectOption } from '../shared/select-option/select-option';
import { AddFamilyTreeModalComponent } from './add-family-tree-modal.component';
import { ADD_NEW_FAMILY_TREE_VALUE, FamilyTreeStoreService } from './family-tree-store.service';

/**
 * Left-of-the-theme-switcher control for choosing which family tree is
 * shown, and for creating new ones via the "Add new family tree" option.
 */
@Component({
  selector: 'app-family-tree-switcher',
  imports: [AddFamilyTreeModalComponent, FormsModule, Select],
  templateUrl: './family-tree-switcher.component.html',
  styleUrl: './family-tree-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class FamilyTreeSwitcherComponent {
  protected readonly store = inject(FamilyTreeStoreService);

  protected readonly isAddModalOpen = signal(false);

  /** Family trees plus a trailing sentinel option that opens the "add new" modal. */
  protected readonly treeOptions = computed<SelectOption<string>[]>(() => [
    ...this.store.trees().map((tree) => ({ value: tree.id, label: tree.name })),
    { value: ADD_NEW_FAMILY_TREE_VALUE, label: '+ Add new family tree…' },
  ]);

  /**
   * Handles a selection change. Picking the "add new" option opens the modal
   * instead of switching trees; since the select's value is bound one-way to
   * `activeTreeId`, not propagating the sentinel leaves it showing the still-
   * active tree once change detection re-renders.
   */
  protected onChange(value: string): void {
    if (value === ADD_NEW_FAMILY_TREE_VALUE) {
      this.isAddModalOpen.set(true);
      return;
    }

    this.store.setActiveTree(value);
  }

  protected closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }
}
