import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import {
  formatFullName,
  getColorForGender,
  type FamilyTreeOccupiedNodeData,
} from '../../../diagram/model/interfaces';
import {
  ComboboxNullOptionDef,
  ComboboxOptionDef,
  ComboboxPrefixDef,
} from '../../../shared/combobox/combobox-option.directive';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '../../../shared/combobox/combobox.component';
import { InitialsAvatarComponent } from '../../../shared/initials-avatar/initials-avatar.component';

@Component({
  selector: 'app-parent-field',
  imports: [
    ComboboxComponent,
    ComboboxOptionDef,
    ComboboxNullOptionDef,
    ComboboxPrefixDef,
    InitialsAvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parent-field.component.html',
  styleUrl: './parent-field.component.scss',
})
export class ParentFieldComponent implements FormValueControl<string | null> {
  candidateNodes = input.required<Node<FamilyTreeOccupiedNodeData>[]>();
  triggerId = input<string>();

  readonly value = model<string | null>(null);

  protected readonly candidates = computed<ComboboxOption<string>[]>(() =>
    this.candidateNodes()
      .map(this.mapNodeToOption)
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  private mapNodeToOption = (node: Node<FamilyTreeOccupiedNodeData>): ComboboxOption<string> => ({
    value: node.id,
    label: formatFullName(node.data.firstName, node.data.lastName),
    data: { color: getColorForGender(node.data.gender) },
  });
}
