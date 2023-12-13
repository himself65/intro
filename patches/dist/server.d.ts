import type { createElement, ReactNode } from 'react';
import type { Slot } from './client.js';
type Elements = Record<string, ReactNode>;
export interface RenderContext<T = unknown> {
    rerender: (name: string) => void;
    context: T;
}
export type RenderEntries = (this: RenderContext, input: string) => Promise<Elements | null>;
export type GetBuildConfig = (unstable_collectClientModules: (input: string) => Promise<string[]>) => Promise<{
    [pathStr: string]: {
        entries?: Iterable<readonly [input: string, skipPrefetch?: boolean]>;
        customCode?: string;
        context?: unknown;
    };
}>;
export type GetSsrConfig = (pathStr: string) => Promise<{
    input: string;
    unstable_render: (opts: {
        createElement: typeof createElement;
        Slot: typeof Slot;
    }) => ReactNode;
} | null>;
export declare function defineEntries(renderEntries: RenderEntries, getBuildConfig?: GetBuildConfig, getSsrConfig?: GetSsrConfig): {
    renderEntries: RenderEntries;
    getBuildConfig: GetBuildConfig | undefined;
    getSsrConfig: GetSsrConfig | undefined;
};
export type EntriesDev = {
    default: ReturnType<typeof defineEntries>;
};
export type EntriesPrd = EntriesDev & {
    loadModule: (id: string) => Promise<unknown>;
    loadHtml: (pathStr: string) => Promise<string>;
};
export {};
