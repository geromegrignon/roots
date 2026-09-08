import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type FormValueControl } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import { PrimeTemplate } from '@openng/optimus-ui/api';
import { Select } from '@openng/optimus-ui/select';
import {
  formatFullName,
  getAvatarSexForGender,
  type FamilyTreeOccupiedNodeData,
} from '../../../diagram/model/interfaces';
import { type SelectOption } from '../../../shared/select-option/select-option';
import { NiceAvatarComponent } from '../../../shared/nice-avatar/nice-avatar.component';

@Component({
  selector: 'app-parent-field',
  imports: [FormsModule, Select, PrimeTemplate, NiceAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parent-field.component.html',
  styleUrl: './parent-field.component.scss',
})
export class ParentFieldComponent implements FormValueControl<string | null> {
  candidateNodes = input.required<Node<FamilyTreeOccupiedNodeData>[]>();
  triggerId = input<string>();

  readonly value = model<string | null>(null);

  protected readonly candidates = computed<SelectOption<string>[]>(() =>
    this.candidateNodes()
      .map(this.mapNodeToOption)
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected onValueChange(value: string | null): void {
    this.value.set(value);
  }

  private mapNodeToOption = (node: Node<FamilyTreeOccupiedNodeData>): SelectOption<string> => ({
    value: node.id,
    label: formatFullName(node.data.firstName, node.data.lastName),
    data: { sex: getAvatarSexForGender(node.data.gender) },
  });
}
