import { resolveConfig } from '../config.js';
import { endStream } from '../utils/stream.js';
import { renderHtml } from './html-renderer.js';
import { decodeInput, hasStatusCode, deepFreeze } from './utils.js';
import { renderRsc } from '../rsc/rsc-renderer.js';
export function createHandler(options) {
    const { config, ssr, unstable_prehook, unstable_posthook, entries } = options;
    if (!unstable_prehook && unstable_posthook) {
        throw new Error('prehook is required if posthook is provided');
    }
    const configPromise = resolveConfig(config || {});
    const loadHtmlPromise = entries.then(({ loadHtml })=>loadHtml);
    let publicIndexHtml;
    const getHtmlStr = async (pathStr)=>{
        const loadHtml = await loadHtmlPromise;
        if (!publicIndexHtml) {
            publicIndexHtml = await loadHtml('/');
        }
        try {
            return loadHtml(pathStr);
        } catch (e) {
            return publicIndexHtml;
        }
    };
    return async (req, res, next)=>{
        const config = await configPromise;
        const basePrefix = config.basePath + config.rscPath + '/';
        const pathStr = req.url.slice(new URL(req.url).origin.length);
        const handleError = (err)=>{
            if (hasStatusCode(err)) {
                res.setStatus(err.statusCode);
            } else {
                console.info('Cannot render RSC', err);
                res.setStatus(500);
            }
            endStream(res.stream);
        };
        let context;
        try {
            context = unstable_prehook?.(req, res);
        } catch (e) {
            handleError(e);
            return;
        }
        if (ssr) {
            try {
                const htmlStr = await getHtmlStr(pathStr);
                const result = htmlStr && await renderHtml({
                    config,
                    pathStr,
                    htmlStr,
                    context,
                    isDev: false,
                    entries: await entries
                });
                if (result) {
                    const [readable, nextCtx] = result;
                    unstable_posthook?.(req, res, nextCtx);
                    res.setHeader('content-type', 'text/html; charset=utf-8');
                    readable.pipeTo(res.stream);
                    return;
                }
            } catch (e) {
                handleError(e);
                return;
            }
        }
        if (pathStr.startsWith(basePrefix)) {
            const { method, contentType } = req;
            if (method !== 'GET' && method !== 'POST') {
                throw new Error(`Unsupported method '${method}'`);
            }
            try {
                const input = decodeInput(pathStr.slice(basePrefix.length));
                const readable = await renderRsc({
                    config,
                    input,
                    method,
                    context,
                    body: req.stream,
                    contentType,
                    isDev: false,
                    entries: await entries
                });
                unstable_posthook?.(req, res, context);
                deepFreeze(context);
                readable.pipeTo(res.stream);
            } catch (e) {
                handleError(e);
            }
            return;
        }
        next();
    };
}
