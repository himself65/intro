import type { ResolvedConfig } from '../config.js';
import type { EntriesDev, EntriesPrd } from '../../server.js';
export declare const REACT_MODULE = "react";
export declare const REACT_MODULE_VALUE = "react";
export declare const RD_SERVER_MODULE = "rd-server";
export declare const RD_SERVER_MODULE_VALUE = "react-dom/server.edge";
export declare const RSDW_CLIENT_MODULE = "rsdw-client";
export declare const RSDW_CLIENT_MODULE_VALUE = "react-server-dom-webpack/client.edge";
export declare const WAKU_CLIENT_MODULE = "waku-client";
export declare const WAKU_CLIENT_MODULE_VALUE = "waku/client";
export declare const renderHtml: <Context>(opts: {
    config: ResolvedConfig;
    pathStr: string;
    htmlStr: string;
    context: Context;
} & ({
    isDev: false;
    entries: EntriesPrd;
} | {
    isDev: true;
    entries: EntriesDev;
})) => Promise<readonly [ReadableStream<any>, Context] | null>;
