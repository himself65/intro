import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BaseReq, BaseRes, Handler } from '../rsc/types.js';
export declare const connectWrapper: (m: Handler<BaseReq & {
    orig: IncomingMessage;
}, BaseRes & {
    orig: ServerResponse;
}>) => (connectReq: IncomingMessage, connectRes: ServerResponse, next: (err?: unknown) => void) => Promise<void>;
