/// <reference types="node" resolution-mode="require"/>
import { createHandler } from '../rsc/handler-dev.js';
export declare function connectMiddleware(...args: Parameters<typeof createHandler>): (connectReq: import("http").IncomingMessage, connectRes: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => Promise<void>;
