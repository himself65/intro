/// <reference types="node" resolution-mode="require"/>
import type { Worker as WorkerOrig } from 'node:worker_threads';
import type { ResolvedConfig } from '../config.js';
export type RenderRequest = {
    input: string;
    method: 'GET' | 'POST';
    contentType: string | undefined;
    config: Omit<ResolvedConfig, 'ssr'>;
    context: unknown;
    stream?: ReadableStream;
    moduleIdCallback?: (id: string) => void;
};
export type BuildOutput = {
    rscFiles: string[];
    htmlFiles: string[];
};
export type MessageReq = ({
    id: number;
    type: 'render';
    hasModuleIdCallback: boolean;
} & Omit<RenderRequest, 'stream' | 'moduleIdCallback'>) | {
    id: number;
    type: 'buf';
    buf: ArrayBuffer;
    offset: number;
    len: number;
} | {
    id: number;
    type: 'end';
} | {
    id: number;
    type: 'err';
    err: unknown;
};
export type MessageRes = {
    type: 'full-reload';
} | {
    type: 'hot-import';
    source: string;
} | {
    id: number;
    type: 'start';
    context: unknown;
} | {
    id: number;
    type: 'buf';
    buf: ArrayBuffer;
    offset: number;
    len: number;
} | {
    id: number;
    type: 'end';
} | {
    id: number;
    type: 'err';
    err: unknown;
    statusCode?: number;
} | {
    id: number;
    type: 'moduleId';
    moduleId: string;
};
export declare function registerReloadCallback(fn: (type: 'full-reload') => void): Promise<() => WorkerOrig>;
export declare function registerImportCallback(fn: (source: string) => void): Promise<() => WorkerOrig>;
export declare function renderRscWithWorker<Context>(rr: RenderRequest): Promise<readonly [ReadableStream, Context]>;
