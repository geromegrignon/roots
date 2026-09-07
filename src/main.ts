import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app.component';
import { appConfig } from './app/app.config';

// Ensures `document.modelContext` exists before Angular's WebMCP tool
// providers try to register against it, for browsers without native support.
initializeWebMCPPolyfill();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
