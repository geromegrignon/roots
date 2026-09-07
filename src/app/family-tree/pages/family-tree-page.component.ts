import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { LayoutAnimationService } from '../diagram/animation/layout-animation.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { AddNodeService } from '../diagram/model/add-node.service';
import { ExpandCollapseService } from '../diagram/model/expand-collapse.service';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { SortOrderService } from '../diagram/model/sort-order.service';
import { NodeVisibilityConfigService } from '../diagram/node-visibility/node-visibility-config.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { ViewportBoundsDirective } from '../diagram/node-visibility/viewport-bounds.directive';
import { ViewportOverlayDirective } from '../diagram/node-visibility/viewport-overlay.directive';
import { AddButtonService } from '../diagram/node/components/add-button/add-button.service';
import { FamilyTreeStoreService } from '../family-trees/family-tree-store.service';
import { MinimapPanelComponent } from '../minimap-panel/minimap-panel.component';
import { NodeMutationService } from '../properties-sidebar/node-mutation.service';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';
import { registerPeopleWebMcpTools } from '../webmcp/people-mcp-tools';

@Component({
  selector: 'app-family-tree-page',
  imports: [
    DiagramComponent,
    PropertiesSidebarComponent,
    TopNavbarComponent,
    MinimapPanelComponent,
    ToolbarHorizontalComponent,
    ViewportBoundsDirective,
    ViewportOverlayDirective,
  ],
  templateUrl: './family-tree-page.component.html',
  styleUrl: './family-tree-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgDiagram(),
    // To customize family-tree settings, uncomment and modify:
    // provideFamilyTreeConfig({ animation: { durationMs: 500 }, viewport: { zoomStep: 0.2 } }),
    PropertiesSidebarService,
    NodeMutationService,
    SortOrderService,
    ExpandCollapseService,
    LayoutGate,
    LayoutService,
    ModelApplyService,
    HierarchyService,
    AddNodeService,
    AddButtonService,
    LayoutAnimationService,
    NodeVisibilityService,
    NodeVisibilityConfigService,
    FamilyTreeStoreService,
  ],
})
export class FamilyTreePageComponent {
  constructor() {
    // Exposes add/update/get/list tools for the people in the tree to a WebMCP
    // agent (https://angular.dev/ai/webmcp). Called here, in this component's own
    // constructor, so the tools resolve NgDiagramModelService, HierarchyService,
    // AddNodeService, and NodeMutationService from this component's providers.
    registerPeopleWebMcpTools();
  }
}
