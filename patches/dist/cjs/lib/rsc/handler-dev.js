"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createHandler", {
    enumerable: true,
    get: function() {
        return createHandler;
    }
});
const _nodestream = require("node:stream");
const _vite = require("vite");
const _pluginreact = /*#__PURE__*/ _interop_require_default(require("@vitejs/plugin-react"));
const _config = require("../config.js");
const _path = require("../utils/path.js");
const _stream = require("../utils/stream.js");
const _htmlrenderer = require("./html-renderer.js");
const _utils = require("./utils.js");
const _nodefs = require("../utils/node-fs.js");
const _workerapi = require("./worker-api.js");
const _vitepluginnonjsresolve = require("../plugins/vite-plugin-nonjs-resolve.js");
const _patchreactrefresh = require("../plugins/patch-react-refresh.js");
const _vitepluginrscindex = require("../plugins/vite-plugin-rsc-index.js");
const _vitepluginrschmr = require("../plugins/vite-plugin-rsc-hmr.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createHandler(options) {
    const { ssr, unstable_prehook, unstable_posthook } = options;
    if (!unstable_prehook && unstable_posthook) {
        throw new Error('prehook is required if posthook is provided');
    }
    const configPromise = (0, _config.resolveConfig)(options.config || {});
    const vitePromise = configPromise.then(async (config)=>{
        const viteServer = await (0, _vite.createServer)({
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
                (0, _vitepluginnonjsresolve.nonjsResolvePlugin)(),
                (0, _patchreactrefresh.patchReactRefresh)((0, _pluginreact.default)()),
                (0, _vitepluginrscindex.rscIndexPlugin)([]),
                (0, _vitepluginrschmr.rscHmrPlugin)()
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
        (0, _workerapi.registerReloadCallback)((type)=>viteServer.ws.send({
                type
            }));
        (0, _workerapi.registerImportCallback)((source)=>(0, _vitepluginrschmr.hotImport)(viteServer, source));
        return viteServer;
    });
    const entries = Promise.all([
        configPromise,
        vitePromise
    ]).then(async ([config, vite])=>{
        const filePath = (0, _path.joinPath)(vite.config.root, config.srcDir, config.entriesJs);
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
            const publicIndexHtmlFile = (0, _path.joinPath)(rootDir, config.indexHtml);
            publicIndexHtml = await (0, _nodefs.readFile)(publicIndexHtmlFile, {
                encoding: 'utf8'
            });
        }
        for (const item of vite.moduleGraph.idToModuleMap.values()){
            if (item.url === pathStr) {
                return null;
            }
        }
        const destFile = (0, _path.joinPath)(rootDir, config.srcDir, pathStr);
        try {
            // check if destFile exists
            const stats = await (0, _nodefs.stat)(destFile);
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
            if ((0, _utils.hasStatusCode)(err)) {
                res.setStatus(err.statusCode);
            } else {
                console.info('Cannot render RSC', err);
                res.setStatus(500);
            }
            (0, _stream.endStream)(res.stream, String(err));
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
                const result = htmlStr && await (0, _htmlrenderer.renderHtml)({
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
                const input = (0, _utils.decodeInput)(pathStr.slice(basePrefix.length));
                const [readable, nextCtx] = await (0, _workerapi.renderRscWithWorker)({
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
        const viteReq = _nodestream.Readable.fromWeb(req.stream);
        viteReq.method = req.method;
        viteReq.url = pathStr;
        viteReq.headers = {
            'content-type': req.contentType
        };
        const viteRes = _nodestream.Writable.fromWeb(res.stream);
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
