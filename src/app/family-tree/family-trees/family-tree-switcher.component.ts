import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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

  private readonly treeSelect = viewChild<ElementRef<HTMLSelectElement>>('treeSelect');

  constructor() {
    // The `[value]` binding on the <select> can't select an <option> that isn't in the DOM
    // yet. Creating a tree adds its <option> (via the @for block) and changes activeTreeId in
    // the very same change-detection pass, but the select's own [value] binding is applied
    // before @for patches in the new <option> — so the browser has nothing to select yet and
    // silently keeps showing the previously-active tree. Re-apply the value imperatively once
    // rendering has settled (afterRenderEffect runs post-render, same pattern as
    // AutofocusDirective) so the select always reflects the active tree, including one just
    // created.
    afterRenderEffect(() => {
      const activeId = this.store.activeTreeId();
      const select = this.treeSelect()?.nativeElement;
      if (select) select.value = activeId;
    });
  }

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
