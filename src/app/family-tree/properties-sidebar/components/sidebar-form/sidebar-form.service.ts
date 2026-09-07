import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { debounce, form } from '@angular/forms/signals';
import { EMPTY_FORM, ON_FIELD_CHANGE, type SidebarFormData } from './sidebar-form.mappers';

const DEBOUNCE_TIME_MS = 300;

@Injectable()
export class SidebarFormService {
  private readonly onFieldChange = inject(ON_FIELD_CHANGE);

  readonly formModel = signal<SidebarFormData>({ ...EMPTY_FORM });

  /**
   * Debounced fields are called out individually (not looped over a
   * `(keyof SidebarFormData)[]` array) because the form mixes string fields
   * (names) with number fields (birth/death years): indexing `schemaPath`
   * with a mixed-type field name inside a loop widens to a union
   * `SchemaPath<...>` type that `debounce()` can't accept.
   */
  readonly fieldTree = form(this.formModel, (schemaPath) => {
    debounce(schemaPath.firstName, DEBOUNCE_TIME_MS);
    debounce(schemaPath.lastName, DEBOUNCE_TIME_MS);
    debounce(schemaPath.birthYear, DEBOUNCE_TIME_MS);
    debounce(schemaPath.deathYear, DEBOUNCE_TIME_MS);
    debounce(schemaPath.spouseFirstName, DEBOUNCE_TIME_MS);
    debounce(schemaPath.spouseLastName, DEBOUNCE_TIME_MS);
    debounce(schemaPath.spouseBirthYear, DEBOUNCE_TIME_MS);
    debounce(schemaPath.spouseDeathYear, DEBOUNCE_TIME_MS);
  });

  private lastEmittedModel: SidebarFormData = { ...EMPTY_FORM };
  private currentNodeId: string | null = null;

  constructor() {
    this.watchForChanges();
  }

  loadFormData(nodeId: string, data: SidebarFormData): void {
    this.flush();

    this.currentNodeId = nodeId;
    this.lastEmittedModel = { ...data };
    this.formModel.set(data);
    this.fieldTree().reset();
  }

  flush(): void {
    this.fieldTree.firstName().markAsTouched();
    this.fieldTree.lastName().markAsTouched();
    this.fieldTree.birthYear().markAsTouched();
    this.fieldTree.deathYear().markAsTouched();
    this.fieldTree.spouseFirstName().markAsTouched();
    this.fieldTree.spouseLastName().markAsTouched();
    this.fieldTree.spouseBirthYear().markAsTouched();
    this.fieldTree.spouseDeathYear().markAsTouched();
  }

  private watchForChanges(): void {
    effect(() => {
      const model = this.formModel();

      untracked(() => {
        if (this.fieldTree().dirty()) {
          const diffs = this.getDiffs(model);
          this.lastEmittedModel = { ...model };
          this.emitChange(diffs, model);
        }
      });
    });
  }

  private emitChange(diffs: (keyof SidebarFormData)[], formData: SidebarFormData): void {
    if (this.currentNodeId && diffs.length) {
      this.onFieldChange({ nodeId: this.currentNodeId, fields: diffs, formData });
    }
  }

  private getDiffs(model: SidebarFormData): (keyof SidebarFormData)[] {
    return (Object.keys(model) as (keyof SidebarFormData)[]).filter(
      (key) => model[key] !== this.lastEmittedModel[key],
    );
  }
}
