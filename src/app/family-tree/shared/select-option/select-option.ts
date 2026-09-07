/** A selectable option for `p-select`/`p-multiselect`-style Optimus UI components. */
export interface SelectOption<T = unknown> {
  value: T;
  label: string;
  data?: unknown;
}
