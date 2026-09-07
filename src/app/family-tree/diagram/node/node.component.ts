import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { DragReorderService } from '../../drag-reorder/drag-reorder.service';
import { FAMILY_TREE_CONFIG } from '../../family-tree.config';
import { LayoutService } from '../layout/layout.service';
import { getHasChildren, getIsHidden } from '../model/data-getters';
import { isOccupiedNodeData, isVacantNode } from '../model/guards';
import { getColorForGender, type FamilyTreeNodeData } from '../model/interfaces';
import { AddButtonComponent } from './components/add-button/add-button.component';
import { CompactNodeComponent } from './components/compact-node/compact-node.component';
import { DropIndicatorComponent } from './components/drop-indicator/drop-indicator.component';
import { FullNodeComponent } from './components/full-node/full-node.component';
import { ToggleExpandButtonComponent } from './components/toggle-expand-button/toggle-expand-button.component';
import { VacantNodeComponent } from './components/vacant-node/vacant-node.component';

type NodeVariant = 'vacant' | 'compact' | 'full';

/**
 * Custom family-tree node template.
 *
 * Renders one of two visual variants depending on vacancy:
 * - **vacant** – no `firstName` set; shows a placeholder card.
 * - **occupied** ("compact" below `viewport.compactScaleThreshold`, "full"
 *   at or above it) – complete card, always including a spouse section
 *   below the primary person when one is set. Person data — including the
 *   spouse — must stay visible at every zoom level, so the compact/full
 *   split no longer hides any content; it's kept as a hook for future
 *   zoom-driven styling (e.g. a denser layout at very low zoom).
 *
 * A node represents a "family unit" (one person, plus an optional spouse
 * shown in the same card) rather than one person per node — the underlying
 * diagram graph stays a plain single-parent tree, exactly like the
 * org-chart template this was forked from.
 *
 * Delegates expand/collapse, drag indicators, and add-node buttons to child components.
 */
@Component({
  imports: [
    NgDiagramPortComponent,
    VacantNodeComponent,
    CompactNodeComponent,
    FullNodeComponent,
    ToggleExpandButtonComponent,
    DropIndicatorComponent,
    AddButtonComponent,
  ],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
    '[class.variant-vacant]': 'variant() === "vacant"',
    '[class.selected]': 'node().selected',
    '[class.is-hidden]': 'isHidden()',
    '[style.visibility]': 'isHidden() ? "hidden" : null',
    '[style.pointer-events]': 'isHidden() ? "none" : null',
    '(mouseenter)': 'isNodeHovered.set(true)',
    '(mouseleave)': 'isNodeHovered.set(false)',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<FamilyTreeNodeData> {
  private readonly config = inject(FAMILY_TREE_CONFIG);
  private readonly layoutService = inject(LayoutService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly dragReorderService = inject(DragReorderService);

  node = input.required<Node<FamilyTreeNodeData>>();

  protected isNodeHovered = signal(false);

  protected isHorizontal = this.layoutService.isHorizontal;

  protected nodeId = computed(() => this.node().id);
  protected isHidden = computed(() => getIsHidden(this.node()));
  protected variant = computed<NodeVariant>(() => {
    if (isVacantNode(this.node())) return 'vacant';
    return this.viewportService.scale() < this.config.viewport.compactScaleThreshold
      ? 'compact'
      : 'full';
  });
  protected color = computed(() => getColorForGender(this.occupiedData()?.gender));
  protected spouseColor = computed(() => getColorForGender(this.occupiedData()?.spouseGender));
  protected occupiedData = computed(() => {
    const data = this.node().data;
    if (!isOccupiedNodeData(data)) {
      return undefined;
    }
    return data;
  });

  protected hasChildren = computed(() => !!getHasChildren(this.node()));
  protected isInDropRange = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      this.dragReorderService.isNodeInDropRange(this.nodeId()),
  );

  protected isRoot = computed(() => {
    // Update computed each time edge changes
    this.modelService.edges();
    const id = this.nodeId();
    const connectedEdges = this.modelService.getConnectedEdges(id);
    return !connectedEdges.some((e) => e.target === id);
  });
  protected showAddButtons = computed(
    () => this.isNodeHovered() && !this.dragReorderService.isReorderActive(),
  );
}
