import type { MiddlewareHandler, Context, Env, Input } from 'hono';
import type { BaseReq, BaseRes, Handler } from '../rsc/types.js';
export declare const honoWrapper: <E extends Env, P extends string, I extends Input>(m: Handler<BaseReq & {
    c: Context<E, P, I>;
}, BaseRes & {
    c: Context<E, P, I>;
}>) => MiddlewareHandler<E, P, I>;
