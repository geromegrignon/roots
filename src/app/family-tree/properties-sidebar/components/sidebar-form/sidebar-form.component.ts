import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Select } from '@openng/optimus-ui/select';
import {
  type FamilyTreeNodeData,
  type FamilyTreeOccupiedNodeData,
  type Gender,
} from '../../../diagram/model/interfaces';
import { type SelectOption } from '../../../shared/select-option/select-option';
import { AutofocusDirective } from '../../../shared/autofocus/autofocus.directive';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ParentFieldComponent } from '../parent-field/parent-field.component';
import { nodeDataToFormData } from './sidebar-form.mappers';
import { SidebarFormService } from './sidebar-form.service';

@Component({
  selector: 'app-sidebar-form',
  imports: [
    FormField,
    FormFieldComponent,
    ParentFieldComponent,
    InputText,
    InputNumber,
    Select,
    AutofocusDirective,
  ],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly formService = inject(SidebarFormService);

  readonly nodeId = input.required<string>();
  readonly nodeData = input.required<FamilyTreeNodeData>();
  readonly nodeParentId = input.required<string | null>();
  readonly parentCandidateNodes = input.required<Node<FamilyTreeOccupiedNodeData>[]>();
  readonly genderOptions = input.required<SelectOption<Gender>[]>();

  protected readonly fieldTree = this.formService.fieldTree;

  constructor() {
    this.syncFormWithInputs();

    inject(DestroyRef).onDestroy(() => {
      this.formService.flush();
    });
  }

  private syncFormWithInputs(): void {
    effect(() => {
      const nodeId = this.nodeId();
      const nodeData = this.nodeData();
      const parentId = this.nodeParentId();

      untracked(() => {
        const formData = nodeDataToFormData(nodeData, parentId);
        this.formService.loadFormData(nodeId, formData);
      });
    });
  }
}
