import type { Plugin } from 'vite';
export declare function rscTransformPlugin(isBuild: boolean, assetsDir?: string, clientEntryFiles?: Record<string, string>, serverEntryFiles?: Record<string, string>): Plugin;
