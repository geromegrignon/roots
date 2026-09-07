import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { FAMILY_TREE_CONFIG } from '../../family-tree.config';
import { ensureNodeVisible } from './viewport';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

/** Pans the viewport to bring a node into the visible (non-obscured) area. */
@Injectable()
export class NodeVisibilityService {
  private readonly config = inject(FAMILY_TREE_CONFIG);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly configService = inject(NodeVisibilityConfigService, { optional: true });

  ensureVisible(nodeId: string): void {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;
    ensureNodeVisible(
      node,
      this.viewportService,
      this.configService?.getViewportInsets(),
      this.config.animation.viewportEnabled,
      this.config.viewport.edgePadding,
      this.config.animation.durationMs,
    );
  }
}
