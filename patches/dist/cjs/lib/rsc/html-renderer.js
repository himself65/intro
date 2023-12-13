"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RD_SERVER_MODULE: function() {
        return RD_SERVER_MODULE;
    },
    RD_SERVER_MODULE_VALUE: function() {
        return RD_SERVER_MODULE_VALUE;
    },
    REACT_MODULE: function() {
        return REACT_MODULE;
    },
    REACT_MODULE_VALUE: function() {
        return REACT_MODULE_VALUE;
    },
    RSDW_CLIENT_MODULE: function() {
        return RSDW_CLIENT_MODULE;
    },
    RSDW_CLIENT_MODULE_VALUE: function() {
        return RSDW_CLIENT_MODULE_VALUE;
    },
    WAKU_CLIENT_MODULE: function() {
        return WAKU_CLIENT_MODULE;
    },
    WAKU_CLIENT_MODULE_VALUE: function() {
        return WAKU_CLIENT_MODULE_VALUE;
    },
    renderHtml: function() {
        return renderHtml;
    }
});
const _stream = require("../utils/stream.js");
const _path = require("../utils/path.js");
const _workerapi = require("./worker-api.js");
const _rscrenderer = require("./rsc-renderer.js");
const _utils = require("./utils.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const REACT_MODULE = 'react';
const REACT_MODULE_VALUE = 'react';
const RD_SERVER_MODULE = 'rd-server';
const RD_SERVER_MODULE_VALUE = 'react-dom/server.edge';
const RSDW_CLIENT_MODULE = 'rsdw-client';
const RSDW_CLIENT_MODULE_VALUE = 'react-server-dom-webpack/client.edge';
const WAKU_CLIENT_MODULE = 'waku-client';
const WAKU_CLIENT_MODULE_VALUE = 'waku/client';
// HACK for react-server-dom-webpack without webpack
const moduleLoading = new Map();
const moduleCache = new Map();
globalThis.__webpack_chunk_load__ = async (id)=>moduleLoading.get(id);
globalThis.__webpack_require__ = (id)=>moduleCache.get(id);
let lastViteServer;
const getViteServer = async ()=>{
    if (lastViteServer) {
        return lastViteServer;
    }
    const { Server } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:http"))).catch((e)=>{
        // XXX explicit catch to avoid bundle time error
        throw e;
    });
    const dummyServer = new Server(); // FIXME we hope to avoid this hack
    const { createServer: viteCreateServer } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("vite"))).catch((e)=>{
        // XXX explicit catch to avoid bundle time error
        throw e;
    });
    const { nonjsResolvePlugin } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("../plugins/vite-plugin-nonjs-resolve.js")));
    const viteServer = await viteCreateServer({
        plugins: [
            nonjsResolvePlugin()
        ],
        ssr: {
            external: [
                'waku'
            ]
        },
        appType: 'custom',
        server: {
            middlewareMode: true,
            hmr: {
                server: dummyServer
            }
        }
    });
    await viteServer.watcher.close(); // TODO watch: null
    await viteServer.ws.close();
    lastViteServer = viteServer;
    return viteServer;
};
const loadServerFileDev = async (fileURL)=>{
    const vite = await getViteServer();
    return vite.ssrLoadModule((0, _path.fileURLToFilePath)(fileURL));
};
const fakeFetchCode = `
Promise.resolve(new Response(new ReadableStream({
  start(c) {
    const f = (s) => new TextEncoder().encode(decodeURI(s));
    globalThis.__WAKU_PUSH__ = (s) => s ? c.enqueue(f(s)) : c.close();
  }
})))
`.split('\n').map((line)=>line.trim()).join('');
const injectRscPayload = (readable, input)=>{
    const chunks = [];
    let closed = false;
    let notify;
    const copied = readable.pipeThrough(new TransformStream({
        transform (chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            chunks.push(chunk);
            notify?.();
            controller.enqueue(chunk);
        },
        flush () {
            closed = true;
            notify?.();
        }
    }));
    const modifyHead = (data)=>{
        const matchPrefetched = data.match(// HACK This is very brittle
        /(.*)<script>\nglobalThis\.__WAKU_PREFETCHED__ = {\n(.*?)\n};(.*)/s);
        let prefetchedLines = [];
        if (matchPrefetched) {
            prefetchedLines = matchPrefetched[2].split('\n');
            data = matchPrefetched[1] + '<script>\n' + matchPrefetched[3];
        }
        const closingHeadIndex = data.indexOf('</head>');
        if (closingHeadIndex === -1) {
            throw new Error('closing head not found');
        }
        data = data.slice(0, closingHeadIndex) + `
<script>
globalThis.__WAKU_PREFETCHED__ = {
${prefetchedLines.filter((line)=>!line.startsWith(`  '${input}':`)).join('\n')}
  '${input}': ${fakeFetchCode},
};
globalThis.__WAKU_SSR_ENABLED__ = true;
</script>
` + data.slice(closingHeadIndex);
        return data;
    };
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const getScripts = ()=>{
        const scripts = chunks.splice(0).map((chunk)=>`
<script>globalThis.__WAKU_PUSH__("${encodeURI(decoder.decode(chunk))}")</script>`);
        if (closed) {
            scripts.push(`
<script>globalThis.__WAKU_PUSH__()</script>`);
        }
        return scripts.join('');
    };
    const interleave = (preamble, intermediate, postamble)=>{
        let preambleSent = false;
        return new TransformStream({
            transform (chunk, controller) {
                if (!(chunk instanceof Uint8Array)) {
                    throw new Error('Unknown chunk type');
                }
                if (!preambleSent) {
                    preambleSent = true;
                    controller.enqueue((0, _stream.concatUint8Arrays)([
                        encoder.encode(modifyHead(preamble)),
                        chunk,
                        encoder.encode(intermediate)
                    ]));
                    notify = ()=>controller.enqueue(encoder.encode(getScripts()));
                    notify();
                    return;
                }
                controller.enqueue(chunk);
            },
            flush (controller) {
                if (!preambleSent) {
                    throw new Error('preamble not yet sent');
                }
                if (!closed) {
                    return new Promise((resolve)=>{
                        notify = ()=>{
                            controller.enqueue(encoder.encode(getScripts()));
                            if (closed) {
                                controller.enqueue(encoder.encode(postamble));
                                resolve();
                            }
                        };
                    });
                }
                controller.enqueue(encoder.encode(postamble));
            }
        });
    };
    return [
        copied,
        interleave
    ];
};
// HACK for now, do we want to use HTML parser?
const rectifyHtml = ()=>{
    const pending = [];
    const decoder = new TextDecoder();
    return new TransformStream({
        transform (chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            pending.push(chunk);
            if (/<\/\w+>$/.test(decoder.decode(chunk))) {
                controller.enqueue((0, _stream.concatUint8Arrays)(pending.splice(0)));
            }
        },
        flush (controller) {
            if (!pending.length) {
                controller.enqueue((0, _stream.concatUint8Arrays)(pending.splice(0)));
            }
        }
    });
};
const renderHtml = async (opts)=>{
    const { config, pathStr, htmlStr, context, isDev, entries } = opts;
    const { default: { getSsrConfig }, loadModule } = entries;
    const [{ createElement }, { renderToReadableStream }, { createFromReadableStream }, { ServerRoot, Slot }] = await Promise.all([
        isDev ? Promise.resolve(REACT_MODULE_VALUE).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))) : loadModule('public/' + REACT_MODULE).then((m)=>m.default),
        isDev ? Promise.resolve(RD_SERVER_MODULE_VALUE).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))) : loadModule('public/' + RD_SERVER_MODULE).then((m)=>m.default),
        isDev ? Promise.resolve(RSDW_CLIENT_MODULE_VALUE).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))) : loadModule('public/' + RSDW_CLIENT_MODULE).then((m)=>m.default),
        isDev ? Promise.resolve(WAKU_CLIENT_MODULE_VALUE).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))) : loadModule('public/' + WAKU_CLIENT_MODULE)
    ]);
    const ssrConfig = await getSsrConfig?.(pathStr);
    if (!ssrConfig) {
        return null;
    }
    const rootDirDev = isDev && (await getViteServer()).config.root;
    let stream;
    let nextCtx;
    try {
        if (isDev) {
            [stream, nextCtx] = await (0, _workerapi.renderRscWithWorker)({
                input: ssrConfig.input,
                method: 'GET',
                contentType: undefined,
                config,
                context
            });
        } else {
            stream = await (0, _rscrenderer.renderRsc)({
                entries,
                config,
                input: ssrConfig.input,
                method: 'GET',
                context,
                isDev: false
            });
            (0, _utils.deepFreeze)(context);
            nextCtx = context;
        }
    } catch (e) {
        if ((0, _utils.hasStatusCode)(e) && e.statusCode === 404) {
            return null;
        }
        throw e;
    }
    const { splitHTML } = config.ssr;
    const moduleMap = new Proxy({}, {
        get (_target, filePath) {
            return new Proxy({}, {
                get (_target, name) {
                    const file = filePath.slice(config.basePath.length);
                    // TODO too long, we need to refactor this logic
                    if (isDev) {
                        if (!rootDirDev) {
                            throw new Error('rootDirDev is not defined');
                        }
                        const filePath = file.startsWith('@fs/') ? (0, _path.decodeFilePathFromAbsolute)(file.slice('@fs'.length)) : (0, _path.joinPath)(rootDirDev, file);
                        const wakuDist = (0, _path.joinPath)((0, _path.fileURLToFilePath)(require("url").pathToFileURL(__filename).toString()), '../../..');
                        if (filePath.startsWith(wakuDist)) {
                            const id = 'waku' + filePath.slice(wakuDist.length).replace(/\.\w+$/, '');
                            if (!moduleLoading.has(id)) {
                                moduleLoading.set(id, Promise.resolve(id).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))).then((m)=>{
                                    moduleCache.set(id, m);
                                }));
                            }
                            return {
                                id,
                                chunks: [
                                    id
                                ],
                                name
                            };
                        }
                        const id = (0, _path.filePathToFileURL)(filePath);
                        if (!moduleLoading.has(id)) {
                            moduleLoading.set(id, loadServerFileDev(id).then((m)=>{
                                moduleCache.set(id, m);
                            }));
                        }
                        return {
                            id,
                            chunks: [
                                id
                            ],
                            name
                        };
                    }
                    // !isDev
                    const id = file;
                    if (!moduleLoading.has(id)) {
                        moduleLoading.set(id, loadModule('public/' + id).then((m)=>{
                            moduleCache.set(id, m);
                        }));
                    }
                    return {
                        id,
                        chunks: [
                            id
                        ],
                        name
                    };
                }
            });
        }
    });
    const [copied, interleave] = injectRscPayload(stream, ssrConfig.input);
    const elements = createFromReadableStream(copied, {
        ssrManifest: {
            moduleMap,
            moduleLoading: null
        }
    });
    const readable = (await renderToReadableStream(createElement(ServerRoot, {
        elements
    }, ssrConfig.unstable_render({
        createElement,
        Slot
    })), {
        onError (err) {
            console.error(err);
        }
    })).pipeThrough(rectifyHtml()).pipeThrough(interleave(...splitHTML(htmlStr)));
    return [
        readable,
        nextCtx
    ];
};
