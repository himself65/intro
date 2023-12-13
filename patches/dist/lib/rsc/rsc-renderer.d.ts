import type { EntriesDev, EntriesPrd } from '../../server.js';
import type { ResolvedConfig } from '../config.js';
export declare const RSDW_SERVER_MODULE = "rsdw-server";
export declare const RSDW_SERVER_MODULE_VALUE = "react-server-dom-webpack/server.edge";
export declare function renderRsc(opts: {
    config: Omit<ResolvedConfig, 'ssr'>;
    input: string;
    method: 'GET' | 'POST';
    context: unknown;
    body?: ReadableStream;
    contentType?: string | undefined;
    moduleIdCallback?: (id: string) => void;
} & ({
    isDev: false;
    entries: EntriesPrd;
} | {
    isDev: true;
    entries: EntriesDev;
    customImport: (fileURL: string) => Promise<unknown>;
})): Promise<ReadableStream>;
export declare function getBuildConfig(opts: {
    config: Omit<ResolvedConfig, 'ssr'>;
    entries: EntriesPrd;
}): Promise<{
    [pathStr: string]: {
        entries?: Iterable<readonly [input: string, skipPrefetch?: boolean]>;
        customCode?: string;
        context?: unknown;
    };
}>;
