import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommunityCvPanelComponent } from './community-cv/community-cv-panel.component';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';
import {
  ON_FIELD_CHANGE,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';
import { SidebarFormService } from './components/sidebar-form/sidebar-form.service';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { NodeMutationService } from './node-mutation.service';
import { PropertiesSidebarService } from './properties-sidebar.service';

@Component({
  selector: 'app-properties-sidebar',
  imports: [
    SidebarHeaderComponent,
    SidebarPlaceholderComponent,
    SidebarFormComponent,
    CommunityCvPanelComponent,
  ],
  providers: [
    SidebarFormService,
    {
      provide: ON_FIELD_CHANGE,
      useFactory: () => {
        const nodeMutationService = inject(NodeMutationService);
        return (change: SidebarFieldChange) => nodeMutationService.handleFieldChange(change);
      },
    },
  ],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.expanded]': 'isExpanded()',
    '[class.cv-active]': 'isCommunityCvActive()',
  },
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeMutationService = inject(NodeMutationService);

  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly state = this.sidebarService.sidebarState;
  protected readonly selectedNode = this.sidebarService.selectedNode;
  protected readonly selectedNodeParentId = this.sidebarService.selectedNodeParentId;
  protected readonly parentCandidateNodes = this.sidebarService.parentCandidateNodes;
  protected readonly genderOptions = this.sidebarService.genderOptions;
  protected readonly isCommunityCvSubject = this.sidebarService.focusedOnCommunityCvSubject;
  protected readonly isCommunityCvActive = this.sidebarService.isCommunityCvActive;

  protected onHeaderToggle(): void {
    this.sidebarService.toggleSidebarVisibility();
  }

  protected onCommunityCvToggle(): void {
    this.sidebarService.toggleCommunityCv();
  }

  protected onRemoveNode(): void {
    const nodeId = this.sidebarService.selectedNode()?.id;
    if (nodeId) {
      this.nodeMutationService.removeNode(nodeId);
    }
  }
}
