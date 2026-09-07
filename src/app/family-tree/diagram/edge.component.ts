import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramModelService,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';
import { getIsHidden } from './model/data-getters';
import { isVacantNode } from './model/guards';
import { type FamilyTreeEdgeData } from './model/interfaces';

/**
 * Custom family-tree edge template.
 *
 * Delegates all rendering to the built-in base edge component.
 * Edges whose source or target node is inside a collapsed subtree
 * are hidden via a host binding on the `isHidden` data flag.
 */
@Component({
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [strokeDasharray]="isVacant() ? '5 5' : undefined"
  />`,
  styleUrl: './edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Hide edges that connect to nodes inside a collapsed subtree.
    '[style.visibility]': 'isHidden() ? "hidden" : null',
  },
})
export class EdgeComponent implements NgDiagramEdgeTemplate<FamilyTreeEdgeData> {
  private readonly modelService = inject(NgDiagramModelService);

  edge = input.required<Edge<FamilyTreeEdgeData>>();

  isHidden = computed(() => getIsHidden(this.edge()));

  // Reads from the `nodes()` signal (not the imperative `getNodeById`) so this recomputes
  // when the target node's data changes - e.g. when a vacant placeholder is filled in via
  // the sidebar form and becomes 'occupied'. `getNodeById` is a plain Map lookup with no
  // reactive dependency, so using it here would leave the edge dashed forever once a node
  // stops being vacant.
  isVacant = computed(() => {
    const targetId = this.edge().target;
    const targetNode = this.modelService.nodes().find((node) => node.id === targetId);
    return isVacantNode(targetNode);
  });
}
