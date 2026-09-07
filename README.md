# ngDiagram Family Tree Template

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/licenses/MIT)

Interactive family tree built with Angular 22 and [ngDiagram](https://www.ngdiagram.dev/), adapted from ngDiagram's [org-chart template](https://www.ngdiagram.dev/templates/org-chart/). Use this project as a starting point for building your own family-tree or tree-based diagram. Lean dependencies: Angular, ngDiagram, and ELK.js — no opinionated third-party UI libraries.

Each node represents a "family unit" — one person, with an optional spouse shown as a second section in the same card, right below them. The diagram graph itself stays a plain single-parent tree, exactly like the org-chart template this was forked from: children hang off one edge per family unit, with no separate union/couple node and no second-parent edge. That's what lets the original ELK tree layout keep working unmodified.

Features:

- Automatic tree layout powered by [ELK.js](https://www.npmjs.com/package/elkjs)
- Horizontal and vertical layout switching
- Expand/collapse subtrees with child count badge
- Drag-and-drop reordering (sibling and reparenting)
- Node creation and removal
- Minimap with zoom controls
- Animated layout transitions
- Three node display variants (full, compact, vacant)
- Each card shows a person plus an optional spouse in the same node
- Color-coded genders with initials avatars
- Dark/light theme
- Properties sidebar demonstrating diagram-to-UI integration
- [WebMCP](https://angular.dev/ai/webmcp) tools so an AI agent can add, update, get, and list people in the tree

## Getting Started

Built against Angular 22.1 and ngDiagram 1.3 (see `package.json`); Node.js 20.19+ or 22.12+ and npm 10+.

```bash
git clone https://github.com/synergycodes/ng-diagram-orgchart.git
cd ng-diagram-orgchart
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200) — a sample family of three generations loads, laid out top-down. Try collapsing a subtree with the badge on a node, dragging one person onto another to change their parent, and switching to the horizontal layout in the toolbar. The sample data lives in [`diagram/data.ts`](src/app/family-tree/diagram/data.ts) — replace it with your own.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run format` | Format code with Prettier |

## ngDiagram APIs Demonstrated

This template wires up most of the ngDiagram public surface, useful as a reference for which APIs to reach for in your own integration.

| Concern | API | Where in this repo |
|---|---|---|
| Bootstrap | `provideNgDiagram()` | `pages/family-tree-page.component.ts` |
| Diagram component | `<ng-diagram>` (`NgDiagramComponent`) | `diagram/diagram.component.html` |
| Background | `<ng-diagram-background>` (`NgDiagramBackgroundComponent`) | `diagram/diagram.component.html` |
| Minimap | `<ng-diagram-minimap>` (`NgDiagramMinimapComponent`), `MinimapNodeStyleFn` | `minimap-panel/minimap-panel.component.ts` |
| Custom node template | `NgDiagramNodeTemplateMap`, `NgDiagramNodeTemplate<TData>` interface | `diagram/diagram.component.ts`, `diagram/node/node.component.ts` |
| Custom edge template | `NgDiagramEdgeTemplateMap`, `NgDiagramEdgeTemplate<TData>`, `NgDiagramBaseEdgeComponent` | `diagram/edge.component.ts` |
| Connection ports | `<ng-diagram-port>` (`NgDiagramPortComponent`) | `diagram/node/node.component.html` |
| Model init | `initializeModel()` | `diagram/diagram.component.ts` |
| Model reads | `NgDiagramModelService` (`getNodeById`, `getEdgeById`, `getConnectedEdges`, `nodes()`, `edges()`, `getModel()`) | throughout `diagram/model/`, `drag-reorder/`, `properties-sidebar/` |
| Model writes | `NgDiagramModelService` (`addNodes`, `addEdges`, `deleteNodes`, `deleteEdges`, `updateNodes`, `updateEdges`, `updateNodeData`) | `diagram/model/model-apply.service.ts`, `properties-sidebar/node-mutation.service.ts` |
| Spatial query | `NgDiagramModelService.getNodesInRange(center, radius)` - find nodes within a pixel radius of a point | `drag-reorder/drag-reorder.service.ts`, `drag-reorder/drag.service.ts` |
| Atomic transactions | `NgDiagramService.transaction(..., { waitForMeasurements: true })` | `diagram/model/model-apply.service.ts` |
| Imperative event subscription | `NgDiagramService.addEventListener / removeEventListener` for events like `'nodeDragStarted'`, `'nodeDragEnded'`, `'selectionMoved'` | `drag-reorder/drag-reorder.service.ts` |
| Template-output event payloads | `DiagramInitEvent`, `SelectionGestureEndedEvent`, `SelectionRemovedEvent`, `NodeDragStartedEvent` | `diagram/diagram.component.ts`, `drag-reorder/drag.service.ts` |
| Viewport state | `NgDiagramViewportService` (`scale()`, `viewport()`) | `diagram/node/node.component.ts`, `diagram/animation/`, `diagram/node-visibility/` |
| Viewport actions | `NgDiagramViewportService` (`zoomToFit`, `zoom`, `moveViewport`) | `diagram/diagram.component.ts`, `minimap-panel/minimap-panel.component.ts`, `diagram/node-visibility/viewport.ts` |
| Selection | `NgDiagramSelectionService` (`selection()`, `select()`) | `properties-sidebar/properties-sidebar.service.ts`, `diagram/node/components/add-button/add-button.service.ts` |
| Config typing | `NgDiagramConfig` (linking, zIndex elevation, etc.) | `diagram/diagram.component.ts` |
| Core types | `Node<TData>`, `Edge<TData>`, `Point`, `Rect`, `Viewport` | throughout |

## WebMCP Tools

The app exposes sixteen [WebMCP](https://angular.dev/ai/webmcp) tools so a browser-based AI agent can drive the family tree directly, without simulating clicks — querying and editing people, exploring relationships, and controlling the diagram's view.

**Querying people**

| Tool | Purpose |
|---|---|
| `list_people` | Lists people in the tree, optionally filtered by a name/spouse-name substring, living/deceased status, a birth-year range, or whether they have children |
| `get_person` | Gets full details for one person by id, including their parent id and children's ids |
| `get_siblings` | Lists a person's siblings (other children of the same parent) |
| `get_ancestors` | Lists a person's ancestor chain (parent, grandparent, ...), nearest first |
| `get_alive_descendants` | Lists the nearest living heir(s) along each branch below a person, for succession/inheritance planning — see below |
| `find_relationship` | Determines how two people are related (parent, sibling, aunt/uncle, Nth cousin M times removed, ...) via their lowest common ancestor |

**Editing people**

| Tool | Purpose |
|---|---|
| `add_person` | Adds a new person as a child of an existing person, optionally with a spouse |
| `add_people` | Adds a batch of people in one call, including multi-generation batches (each entry can reference another entry in the same batch as its parent) |
| `update_person` | Updates one or more fields on an existing person; omitted fields are left as-is |
| `remove_person` | Removes a person; refuses if they have descendants unless `cascade: true` is passed |
| `reorder_children` | Reorders a person's children to a given sequence of ids |

**Controlling the view**

| Tool | Purpose |
|---|---|
| `focus_people` | Selects and pans/zooms the viewport to fit a given set of people, without changing any data |
| `zoom_to_fit` | Pans/zooms the viewport to fit the whole tree |
| `set_layout_direction` | Switches the tree between top-to-bottom (`DOWN`) and left-to-right (`RIGHT`) layout |
| `set_subtree_collapsed` | Expands or collapses a person's subtree in the diagram |
| `export_tree` | Exports the entire diagram (all nodes and edges) as structured JSON |

`get_alive_descendants` walks the subtree below the given person and, on each branch, stops as soon as it finds a living, filled-in person — that person is the heir on that line, so their own children are not explored or included. A deceased descendant (or an unfilled-in placeholder) is passed through rather than stopping the search, so a grandchild whose parent has died can still surface as the nearest heir on that branch (representation). Each result carries its generation below the ancestor and which of the ancestor's direct children that line descends from (its branch, or 'stirps'), useful for grouping heirs by branch. `find_relationship` and `get_ancestors` share the same caution: all three return genealogical facts only — none of them determines legal heirs, shares, or entitlement, which depend on jurisdiction and applicable succession law.

`remove_person` improves on the properties sidebar's own "Remove node" button, which deletes a node with no warning even if it has children — the WebMCP tool instead refuses to remove a person with descendants unless the caller explicitly opts in with `cascade: true`.

This relies on `declareExperimentalWebMcpTool`, an experimental Angular 22 API — see [angular.dev/ai/webmcp](https://angular.dev/ai/webmcp). (Its sibling `provideExperimentalWebMcpTools`, meant for a component's `providers` array, doesn't work here: it returns `EnvironmentProviders`, which isn't assignable to a component's `providers: Provider[]`, so tools are declared directly instead — see "Key Patterns" below.) Since no browser ships native WebMCP support yet, [`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill) is initialized in `src/main.ts` before `bootstrapApplication` so `document.modelContext` exists in time for tool registration; without a polyfill or native support, registration silently no-ops.

The tools are declared in `src/app/family-tree/webmcp/people-mcp-tools.ts` and registered from `FamilyTreePageComponent`'s constructor, so each tool's `execute` can `inject()` the same page-scoped services the rest of the UI uses (`NgDiagramModelService`, `NgDiagramSelectionService`, `NgDiagramViewportService`, `HierarchyService`, `AddNodeService`, `NodeMutationService`, `SortOrderService`, `ExpandCollapseService`, `LayoutService`, `ModelApplyService`, `NodeVisibilityService`). `add_person`/`add_people`/`update_person` build on the same `formDataToNodeData`/`nodeDataToFormData` mappers the properties sidebar form uses, and mutating tools that change the diagram's selection or viewport (`add_person`, `update_person`, `add_people`, `focus_people`) select and pan/zoom to the affected person/people afterwards, so an agent's changes are always visible without a follow-up call.

To try it, open the browser console and inspect the registered tools:

```javascript
await document.modelContext.getTools()
```

## Customizing for Your Project

### Configuration

All tunable values (animation speed, layout spacing, zoom behavior, drag thresholds) are centralized in a single config file:

**`src/app/family-tree/family-tree.config.ts`**

To override defaults, add `provideFamilyTreeConfig` to your page providers:

```typescript
import { provideFamilyTreeConfig } from './family-tree.config';

providers: [
  provideFamilyTreeConfig({
    animation: { durationMs: 500, layoutEnabled: false },
    layout: { nodeSpacing: 200 },
    viewport: { compactScaleThreshold: 0.5, zoomStep: 0.25 },
    drag: { detectionRange: 150 },
  }),
]
```

Unspecified values keep their defaults. See `FamilyTreeConfig` interface for all options with documentation.

### Data Model

Node and edge data interfaces are defined in `src/app/family-tree/diagram/model/interfaces.ts`. The base node data includes properties for tree behavior:

| Property | Purpose |
|---|---|
| `isCollapsed` | Whether the node's subtree is collapsed |
| `isHidden` | Whether the node is hidden (inside a collapsed subtree) |
| `hasChildren` | Whether the node has child nodes |
| `collapsedChildrenCount` | Cached descendant count for collapsed nodes |
| `sortOrder` | Sibling ordering within the tree |

Property names are exported as constants (e.g., `IS_COLLAPSED`, `HAS_CHILDREN`) from the same file. All reads go through getter functions in `data-getters.ts`, and all writes use bracket notation with these constants. To rename a property, change the constant value and the interface, no other files need updating.

An occupied node (`FamilyTreeOccupiedNodeData`) adds the person fields: `firstName`, `lastName`, `gender`, `birthYear`, `deathYear`, plus a mirrored set for an optional spouse — `spouseFirstName`, `spouseLastName`, `spouseGender`, `spouseBirthYear`, `spouseDeathYear`. A node is a "family unit", not strictly one person: when `spouseFirstName` is set, the spouse renders as a second section in the same card, below the primary person. Children still hang off a single edge from that one node, so the underlying graph never needs a second parent edge or a separate couple node.

### Node Variants

The node component (`src/app/family-tree/diagram/node/`) renders three visual variants:

- **full** - complete card with the primary person's lifespan, plus a spouse section below them when `spouseFirstName` is set (zoom >= `viewport.compactScaleThreshold`)
- **compact** - same content as full, including the spouse section (zoom < threshold) - person data stays visible at every zoom level; the split is kept as a hook for future zoom-driven styling rather than to hide content
- **vacant** - placeholder card for an unnamed person

To customize node appearance, edit the components in `src/app/family-tree/diagram/node/components/`.

### Adding Your Own Data

Replace the seed data in `src/app/family-tree/diagram/data.ts`. Each node needs:

- A unique `id`
- `type: 'familyTreeNode'`
- `position: { x: 0, y: 0 }` (layout engine computes actual positions)
- A `data` object matching `FamilyTreeNodeData`

Edges connect nodes via `source`/`target` IDs with port names `'port-out'` and `'port-in'`.

### Theming

Theme is driven by the `data-theme` attribute on `<html>` (`"light"` or `"dark"`) and persisted in `localStorage`. The toggle UI lives in `src/app/family-tree/top-navbar/theme-toggle.component.ts`.

Color tokens are defined in `src/tokens.css`:

- **`--ngd-colors-*`** - base palette (grays + accent ramps `acc1`–`acc9` with shade and alpha variants).
- **`--ngd-gender-*`** - gender-to-color mapping consumed by node templates (`--ngd-gender-male`, `--ngd-gender-female`). Each variable points at one of the palette colors, so swapping the accent color is a one-line edit.

Gender maps to a CSS variable via `getColorForGender()` in `src/app/family-tree/diagram/model/interfaces.ts`. To change the accent color for a gender, edit the corresponding `--ngd-gender-*` token in `tokens.css`.

Global stylesheet entry point: `src/styles.css` (imports `tokens.css`, typography, and `ng-diagram/styles.css`).

### Layout Engine

Tree positions are computed by [ELK.js](https://www.npmjs.com/package/elkjs) using the `mrtree` algorithm. The integration is intentionally narrow:

- **`diagram/layout/perform-layout.ts`** - single ELK call site. Converts ngDiagram nodes/edges into ELK input, runs `elk.layout(...)`, and returns the same nodes with updated `position`. Also enforces a uniform node size across the layout (the cached max width/height across all runs) so spacing stays stable when the compact/full variants produce different sizes.
- **`diagram/layout/layout.service.ts`** - orchestration. Resolves the visible set (collapsed subtrees excluded), applies pending mutations from `ModelChanges` (deletions, edge-source overrides, new nodes, sort-order overrides), invokes `performLayout`, **pins the root** so the chart doesn't jump after re-layout, then writes position updates back into the same `ModelChanges` instance.
- **`diagram/layout/visible-set.ts`** - pure helpers: `getVisibleSet` (current), `getFutureVisibleSet` (predicted after a collapse/expand), `findRootNode`.

To swap ELK for another engine (d3-hierarchy, dagre etc.), replace `perform-layout.ts` with a function of the same shape:

```typescript
(nodes: Node[], edges: Edge[], direction: 'DOWN' | 'RIGHT', nodeSpacing: number) => Promise<Node[]>
```

`LayoutService` is the only caller, and it handles visibility / sort-order / root-pinning around the call, so a replacement only needs to assign positions.

`LayoutService` pre-sorts nodes and edges by `sortOrder` before invoking the engine, relying on the engine to honor that input order for siblings. ELK's `mrtree` does; other libraries may not. If the chosen engine doesn't preserve input order, the adapter can read each node's `sortOrder` (via `getSortOrder` from `model/data-getters.ts`) and pass it to the library in whatever ordering format it accepts.


## Architecture

### Service Hierarchy

All services are provided at the page component level (`FamilyTreePageComponent`), no `providedIn: 'root'`. Drag-reorder services are scoped to the `DiagramComponent`.

```
FamilyTreePageComponent (providers)
  ├── Layout: LayoutGate, LayoutService, LayoutAnimationService
  ├── Model: ModelApplyService, HierarchyService, SortOrderService,
  │          ExpandCollapseService, AddNodeService
  ├── UI: PropertiesSidebarService (→ NodeMutationService),
  │       NodeVisibilityService,
  │       NodeVisibilityConfigService
  ├── Node actions: AddButtonService
  └── DiagramComponent (providers)
      └── DragService, DropService, DragReorderService
```

### Key Patterns

- **Compute-then-apply mutations** - services build a `ModelChanges` accumulator (partial data patches allowed); `ModelApplyService` resolves patches against current state, runs layout and animation, and commits in a single `LayoutGate`-serialized transaction.
- **Centralized property keys + getters** - every node/edge data field has a string-constant key (`IS_COLLAPSED`, `HAS_CHILDREN`, …) and a getter in `data-getters.ts`. Renames touch one constant + the interface; no callsites.
- **Viewport overlays** - `appViewportBounds` / `appViewportOverlay` directives register UI elements that obscure the diagram so visibility calculations account for them.

- **WebMCP tools declared in an injection context** - `declareExperimentalWebMcpTool` captures the injector active where it's called and runs each tool's `execute` back in that context, so calling it directly in `FamilyTreePageComponent`'s constructor lets every tool `inject()` the page's own services. `provideExperimentalWebMcpTools` (component `providers`) doesn't fit here since it returns `EnvironmentProviders`, not a plain `Provider`.

## Project Structure

```
src/app/family-tree/
├── family-tree.config.ts                 # Central configuration
├── pages/                              # Page container
├── diagram/
│   ├── diagram.component.ts            # Main diagram component
│   ├── edge.component.ts               # Edge template
│   ├── data.ts                         # Seed data
│   ├── model/                          # Domain types & services
│   │   ├── interfaces.ts               # Data types + property key constants
│   │   ├── data-getters.ts             # Centralized property accessors
│   │   ├── model-changes.ts            # Change accumulator
│   │   ├── model-apply.service.ts      # Applies changes with layout
│   │   ├── hierarchy.service.ts        # Parent-child relationships
│   │   ├── expand-collapse.service.ts  # Subtree visibility
│   │   ├── sort-order.service.ts       # Sibling ordering
│   │   └── add-node.service.ts         # Node creation
│   ├── node/                           # Node rendering (3 variants)
│   ├── layout/                         # ELK.js layout engine
│   ├── animation/                      # Layout + viewport animations
│   └── node-visibility/                # Viewport-aware visibility
├── drag-reorder/                       # Drag-and-drop subsystem
│   ├── zone-detection/                 # Drop zone strategies
│   └── drop-strategy/                  # Drop action strategies
├── properties-sidebar/                 # Node editing panel
├── shared/                             # Reusable UI (combobox, avatar)
├── top-navbar/                         # Navigation bar + theme toggle
├── toolbar-horizontal/                 # Layout direction toolbar
├── minimap-panel/                      # Minimap with zoom controls
└── webmcp/                             # WebMCP tools (add/update/get/list people)
```

## Tech Stack

- **Angular 22** - standalone components, signals, OnPush change detection
- **ngDiagram** ([`ng-diagram`](https://www.npmjs.com/package/ng-diagram) on npm) - diagram rendering, viewport management, selection
- **ELK.js** - automatic tree layout
- **[`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill)** - provides `document.modelContext` for Angular's experimental WebMCP tool APIs in browsers without native support
- **Prettier** - code formatting

## Known ngDiagram Issues

The template contains a few workarounds and compromises driven by current library gaps. Resolving these would let us simplify the template.

### Issues with workarounds in this repo

- **No API for hiding a node.** ngDiagram wraps each custom node in a `.node-content` div that intercepts pointer events, so hiding the custom node alone isn't enough. *Workaround:* `::ng-deep` CSS in `node.component.scss` reaches up to the wrapper to suppress both visibility and pointer events. A first-class hidden-node property would remove the `::ng-deep` entirely.

### Issues without workarounds (felt by end users)

- **Resize batch re-runs edge routing per node.** When many nodes change size at once (for example, 500 nodes switching between compact and full variants on a zoom threshold), edges visibly disconnect from their nodes for roughly one to two seconds before snapping back.
- **Layout animation is naive in the template.** The animation implementation in this template is fairly naive. Proper native animation support in ngDiagram is needed so the template can drop its custom animation code. If you notice lag from animations, you can turn them off by passing `animation: { layoutEnabled: false }` to `provideFamilyTreeConfig` (see "Configuration" above).

All of the above are the highest-priority items for the team to fix in ngDiagram. That said, the template works today and is fully usable as-is.

## ngDiagram Documentation

For comprehensive ngDiagram documentation, examples, and API reference, visit: **[ngdiagram.dev/docs](https://www.ngdiagram.dev/docs)**

Related reading: **[Building an org chart with ngDiagram — a hands-on write-up (the template this fork started from)](https://dev.to/ngdiagram-dev/ive-used-gojs-for-years-heres-what-happened-when-i-built-an-org-chart-with-ngdiagram-1gkn)** on dev.to, by a developer coming from another diagram library: the brief, the build, and the trade-offs.

## Support

- **Issues**: [GitHub Issues](https://github.com/synergycodes/ng-diagram-orgchart/issues)
- **Discussions**: [GitHub Discussions](https://github.com/synergycodes/ng-diagram-orgchart/discussions)
- **ngDiagram Discussions**: [GitHub Discussions](https://github.com/synergycodes/ng-diagram/discussions), [Discord](https://discord.gg/FDMjRuarFb)
- **ngDiagram Documentation**: [ngdiagram.dev/docs](https://www.ngdiagram.dev/docs)

## License

MIT — see [LICENSE](LICENSE).

---

Built with ❤️ by the [Synergy Codes](https://www.synergycodes.com/) team
