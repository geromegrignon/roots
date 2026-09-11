import { DestroyRef, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
// Type-only: brings in this package's `declare global { interface Document { modelContext } }`
// augmentation so `document.modelContext` below type-checks. Not imported anywhere else in
// this app's TS program (only @mcp-b/webmcp-polyfill's *runtime* is imported, in main.ts, and
// its public entry point doesn't re-export these types), and erased entirely at build time.
import type {} from '@mcp-b/webmcp-types';
import { FamilyTreeStoreService } from '../family-trees/family-tree-store.service';

/**
 * Annotations `document.modelContext.registerTool()` accepts, per the WebMCP
 * imperative API docs
 * (https://developer.chrome.com/docs/ai/webmcp/imperative-api#supported_annotations):
 * `readOnlyHint`, `untrustedContentHint`, and `consequentialHint` (flags an action
 * with significant, hard-to-reverse real-world consequences).
 *
 * `@mcp-b/webmcp-polyfill`'s own `WebMcpToolAnnotations` type — and its runtime
 * `toWebMcpAnnotations()` normalizer — only carry `readOnlyHint`/`untrustedContentHint`
 * as of the pinned 5.1.0, so `consequentialHint` is currently stripped back out by the
 * polyfill's own `getTools()`/testing surface, even though it's accepted here without a
 * type error. It's still set below: real WebMCP-capable consumers reading
 * `document.modelContext` directly (rather than through this polyfill's compatibility
 * shims) do see it, and it's the correct annotation for what this tool does.
 */
interface FamilyTreeToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

const LIST_FAMILY_TREES_ANNOTATIONS: FamilyTreeToolAnnotations = {
  readOnlyHint: true,
  untrustedContentHint: false,
};

const DELETE_FAMILY_TREE_ANNOTATIONS: FamilyTreeToolAnnotations = {
  readOnlyHint: false,
  untrustedContentHint: false,
  consequentialHint: true,
};

/**
 * Registers whole-family-tree management as WebMCP tools (`list_family_trees`,
 * `delete_family_tree`) directly against the standard browser
 * `document.modelContext` imperative API
 * (https://developer.chrome.com/docs/ai/webmcp/imperative-api), rather than through
 * Angular's `declareExperimentalWebMcpTool()` wrapper that `registerPeopleWebMcpTools()`
 * uses — this pair is this app's deliberate example of talking to the un-wrapped
 * browser API directly, including its `AbortSignal`-based unregistration.
 *
 * Must be called from within an injection context that has access to the family-tree
 * page's own `FamilyTreeStoreService` provider and a `DestroyRef` to tear the tools
 * down if that context is ever destroyed.
 */
export function registerFamilyTreesWebMcpTools(): void {
  const store = inject(FamilyTreeStoreService);
  const messageService = inject(MessageService);
  const destroyRef = inject(DestroyRef);

  const modelContext = document.modelContext;
  if (!modelContext) {
    // No native browser support, and the polyfill (initialized in main.ts) somehow
    // didn't install — nothing to register against.
    return;
  }

  // Ties both tool registrations to this injection context's lifetime, per the
  // imperative API's own unregistration pattern: pass an AbortController's signal to
  // registerTool(), then abort() it later to unregister without interrupting an
  // in-flight execution.
  const controller = new AbortController();
  destroyRef.onDestroy(() => controller.abort());

  function announce(toolName: string): void {
    messageService.add({
      severity: 'info',
      summary: 'WebMCP tool invoked',
      detail: toolName,
      life: 3000,
    });
  }

  modelContext
    .registerTool(
      {
        name: 'list_family_trees',
        description:
          'Lists every family tree known to this app (id and display name), and which one is ' +
          "currently active/displayed. Use this to find a tree's id before calling delete_family_tree.",
        inputSchema: { type: 'object', properties: {} },
        annotations: LIST_FAMILY_TREES_ANNOTATIONS,
        execute: async () => {
          announce('list_family_trees');
          return { trees: store.trees(), activeTreeId: store.activeTreeId() };
        },
      },
      { signal: controller.signal },
    )
    .catch((err: unknown) =>
      console.error('Failed to register list_family_trees WebMCP tool:', err),
    );

  modelContext
    .registerTool(
      {
        name: 'delete_family_tree',
        description:
          'Permanently deletes a family tree — all of its people and layout — by id. The default ' +
          '"grignon" tree can\'t be deleted. If the deleted tree was the active one, another tree ' +
          'becomes active automatically. This cannot be undone.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The id of the family tree to delete (see list_family_trees).',
            },
          },
          required: ['id'],
        },
        annotations: DELETE_FAMILY_TREE_ANNOTATIONS,
        execute: async (input: { id: string }) => {
          const tree = store.trees().find((candidate) => candidate.id === input.id);
          if (!tree) {
            return { error: `No family tree found with id "${input.id}".` };
          }
          if (!store.canDelete(tree.id)) {
            return { error: `The default "${tree.name}" family tree can't be deleted.` };
          }
          store.deleteTree(tree.id);
          announce('delete_family_tree');
          return { id: tree.id, message: `Deleted the "${tree.name}" family tree.` };
        },
      },
      { signal: controller.signal },
    )
    .catch((err: unknown) =>
      console.error('Failed to register delete_family_tree WebMCP tool:', err),
    );
}
