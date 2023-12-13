import { Readable, Writable } from 'node:stream';
import { createServer as viteCreateServer } from 'vite';
import { default as viteReact } from '@vitejs/plugin-react';
import { resolveConfig } from '../config.js';
import { joinPath } from '../utils/path.js';
import { endStream } from '../utils/stream.js';
import { renderHtml } from './html-renderer.js';
import { decodeInput, hasStatusCode } from './utils.js';
import { readFile, stat } from '../utils/node-fs.js';
import { registerReloadCallback, registerImportCallback, renderRscWithWorker } from './worker-api.js';
import { nonjsResolvePlugin } from '../plugins/vite-plugin-nonjs-resolve.js';
import { patchReactRefresh } from '../plugins/patch-react-refresh.js';
import { rscIndexPlugin } from '../plugins/vite-plugin-rsc-index.js';
import { rscHmrPlugin, hotImport } from '../plugins/vite-plugin-rsc-hmr.js';
export function createHandler(options) {
    const { ssr, unstable_prehook, unstable_posthook } = options;
    if (!unstable_prehook && unstable_posthook) {
        throw new Error('prehook is required if posthook is provided');
    }
    const configPromise = resolveConfig(options.config || {});
    const vitePromise = configPromise.then(async (config)=>{
        const viteServer = await viteCreateServer({
            base: config.basePath,
            optimizeDeps: {
                include: [
                    'react-server-dom-webpack/client'
                ],
                exclude: [
                    'waku'
                ]
            },
            plugins: [
                nonjsResolvePlugin(),
                patchReactRefresh(viteReact()),
                rscIndexPlugin([]),
                rscHmrPlugin()
            ],
            ssr: {
                external: [
                    'waku'
                ]
            },
            server: {
                middlewareMode: true
            }
        });
        registerReloadCallback((type)=>viteServer.ws.send({
                type
            }));
        registerImportCallback((source)=>hotImport(viteServer, source));
        return viteServer;
    });
    const entries = Promise.all([
        configPromise,
        vitePromise
    ]).then(async ([config, vite])=>{
        const filePath = joinPath(vite.config.root, config.srcDir, config.entriesJs);
        return vite.ssrLoadModule(filePath);
    });
    let publicIndexHtml;
    const getHtmlStr = async (pathStr)=>{
        const [config, vite] = await Promise.all([
            configPromise,
            vitePromise
        ]);
        const rootDir = vite.config.root;
        if (!publicIndexHtml) {
            const publicIndexHtmlFile = joinPath(rootDir, config.indexHtml);
            publicIndexHtml = await readFile(publicIndexHtmlFile, {
                encoding: 'utf8'
            });
        }
        for (const item of vite.moduleGraph.idToModuleMap.values()){
            if (item.url === pathStr) {
                return null;
            }
        }
        const destFile = joinPath(rootDir, config.srcDir, pathStr);
        try {
            // check if destFile exists
            const stats = await stat(destFile);
            if (stats.isFile()) {
                return null;
            }
        } catch (e) {
        // does not exist
        }
        // FIXME: otherwise SSR on Windows will fail
        if (pathStr.startsWith('/@fs')) {
            return null;
        }
        return vite.transformIndexHtml(pathStr, publicIndexHtml);
    };
    return async (req, res, next)=>{
        const [config, vite] = await Promise.all([
            configPromise,
            vitePromise
        ]);
        const basePrefix = config.basePath + config.rscPath + '/';
        const pathStr = req.url.slice(new URL(req.url).origin.length);
        const handleError = (err)=>{
            if (hasStatusCode(err)) {
                res.setStatus(err.statusCode);
            } else {
                console.info('Cannot render RSC', err);
                res.setStatus(500);
            }
            endStream(res.stream, String(err));
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
                    isDev: true,
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
                const [readable, nextCtx] = await renderRscWithWorker({
                    input,
                    method,
                    contentType,
                    config,
                    context,
                    stream: req.stream
                });
                unstable_posthook?.(req, res, nextCtx);
                readable.pipeTo(res.stream);
            } catch (e) {
                handleError(e);
            }
            return;
        }
        const viteReq = Readable.fromWeb(req.stream);
        viteReq.method = req.method;
        viteReq.url = pathStr;
        viteReq.headers = {
            'content-type': req.contentType
        };
        const viteRes = Writable.fromWeb(res.stream);
        Object.defineProperty(viteRes, 'statusCode', {
            set (code) {
                res.setStatus(code);
            }
        });
        const headers = new Map();
        viteRes.setHeader = (name, value)=>{
            headers.set(name, value);
            res.setHeader(name, value);
        };
        viteRes.getHeader = (name)=>headers.get(name);
        viteRes.writeHead = (code, headers)=>{
            res.setStatus(code);
            for (const [name, value] of Object.entries(headers || {})){
                viteRes.setHeader(name, value);
            }
        };
        vite.middlewares(viteReq, viteRes, next);
        return;
    };
}
