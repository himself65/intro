import type { Config } from '../config.js';
import type { BaseReq, BaseRes, Handler } from './types.js';
export declare function createHandler<Context, Req extends BaseReq, Res extends BaseRes>(options: {
    config?: Config;
    ssr?: boolean;
    unstable_prehook?: (req: Req, res: Res) => Context;
    unstable_posthook?: (req: Req, res: Res, ctx: Context) => void;
}): Handler<Req, Res>;
