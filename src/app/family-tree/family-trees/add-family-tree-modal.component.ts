import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { AutofocusDirective } from '../shared/autofocus/autofocus.directive';
import { FormFieldComponent } from '../properties-sidebar/components/form-field/form-field.component';
import { FamilyTreeStoreService } from './family-tree-store.service';

/**
 * Modal for creating a new family tree, opened from
 * {@link FamilyTreeSwitcherComponent}'s "Add new family tree" option.
 */
@Component({
  selector: 'app-add-family-tree-modal',
  imports: [FormFieldComponent, AutofocusDirective],
  templateUrl: './add-family-tree-modal.component.html',
  styleUrl: './add-family-tree-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class AddFamilyTreeModalComponent {
  private readonly store = inject(FamilyTreeStoreService);

  readonly isOpen = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly name = signal('');

  protected onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  /** Plain `(submit)`, not `(ngSubmit)` — this app doesn't import FormsModule, so
   *  there's no NgForm directive to emit ngSubmit; without preventDefault() here,
   *  the button's native form submission would reload the page. */
  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (!this.store.createTree(this.name())) return;
    this.close();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected close(): void {
    this.name.set('');
    this.closed.emit();
  }
}
