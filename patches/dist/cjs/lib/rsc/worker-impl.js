// This file can depend on Node.js
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _nodeurl = /*#__PURE__*/ _interop_require_default(require("node:url"));
const _nodeworker_threads = require("node:worker_threads");
const _nodehttp = require("node:http");
const _vite = require("vite");
const _path = require("../utils/path.js");
const _utils = require("./utils.js");
const _rscrenderer = require("./rsc-renderer.js");
const _vitepluginnonjsresolve = require("../plugins/vite-plugin-nonjs-resolve.js");
const _vitepluginrsctransform = require("../plugins/vite-plugin-rsc-transform.js");
const _vitepluginrscreload = require("../plugins/vite-plugin-rsc-reload.js");
const _vitepluginrscdelegate = require("../plugins/vite-plugin-rsc-delegate.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
const IS_NODE_20 = Number(process.versions.node.split('.')[0]) >= 20;
if (IS_NODE_20) {
    const { default: { register } } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:module")));
    register('waku/node-loader', _nodeurl.default.pathToFileURL('./'));
}
const controllerMap = new Map();
const handleRender = async (mesg)=>{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, type, hasModuleIdCallback, ...rest } = mesg;
    const rr = rest;
    try {
        const stream = new ReadableStream({
            start (controller) {
                controllerMap.set(id, controller);
            }
        });
        rr.stream = stream;
        if (hasModuleIdCallback) {
            rr.moduleIdCallback = (moduleId)=>{
                const mesg = {
                    id,
                    type: 'moduleId',
                    moduleId
                };
                _nodeworker_threads.parentPort.postMessage(mesg);
            };
        }
        const readable = await (0, _rscrenderer.renderRsc)({
            config: rr.config,
            input: rr.input,
            method: rr.method,
            context: rr.context,
            body: rr.stream,
            contentType: rr.contentType,
            ...rr.moduleIdCallback ? {
                moduleIdCallback: rr.moduleIdCallback
            } : {},
            isDev: true,
            customImport: loadServerFile,
            entries: await loadEntries(rr.config)
        });
        const mesg = {
            id,
            type: 'start',
            context: rr.context
        };
        _nodeworker_threads.parentPort.postMessage(mesg);
        (0, _utils.deepFreeze)(rr.context);
        const writable = new WritableStream({
            write (chunk) {
                if (!(chunk instanceof Uint8Array)) {
                    throw new Error('Unknown chunk type');
                }
                const mesg = {
                    id,
                    type: 'buf',
                    buf: chunk.buffer,
                    offset: chunk.byteOffset,
                    len: chunk.byteLength
                };
                _nodeworker_threads.parentPort.postMessage(mesg, [
                    mesg.buf
                ]);
            },
            close () {
                const mesg = {
                    id,
                    type: 'end'
                };
                _nodeworker_threads.parentPort.postMessage(mesg);
            }
        });
        readable.pipeTo(writable);
    } catch (err) {
        const mesg = {
            id,
            type: 'err',
            err
        };
        if ((0, _utils.hasStatusCode)(err)) {
            mesg.statusCode = err.statusCode;
        }
        _nodeworker_threads.parentPort.postMessage(mesg);
    }
};
const dummyServer = new _nodehttp.Server(); // FIXME we hope to avoid this hack
const vitePromise = (0, _vite.createServer)({
    plugins: [
        (0, _vitepluginnonjsresolve.nonjsResolvePlugin)(),
        (0, _vitepluginrsctransform.rscTransformPlugin)(false),
        (0, _vitepluginrscreload.rscReloadPlugin)((type)=>{
            const mesg = {
                type
            };
            _nodeworker_threads.parentPort.postMessage(mesg);
        }),
        (0, _vitepluginrscdelegate.rscDelegatePlugin)((source)=>{
            const mesg = {
                type: 'hot-import',
                source
            };
            _nodeworker_threads.parentPort.postMessage(mesg);
        })
    ],
    ssr: {
        resolve: {
            conditions: [
                'react-server',
                'workerd'
            ],
            externalConditions: [
                'react-server',
                'workerd'
            ]
        },
        external: [
            'react',
            'react-server-dom-webpack'
        ],
        noExternal: /^(?!node:)/
    },
    appType: 'custom',
    server: {
        middlewareMode: true,
        hmr: {
            server: dummyServer
        }
    }
}).then(async (vite)=>{
    await vite.ws.close();
    return vite;
});
const loadServerFile = async (fileURL)=>{
    const vite = await vitePromise;
    return vite.ssrLoadModule((0, _path.fileURLToFilePath)(fileURL));
};
const loadEntries = async (config)=>{
    const vite = await vitePromise;
    const filePath = (0, _path.joinPath)(vite.config.root, config.srcDir, config.entriesJs);
    return vite.ssrLoadModule(filePath);
};
_nodeworker_threads.parentPort.on('message', (mesg)=>{
    if (mesg.type === 'render') {
        handleRender(mesg);
    } else if (mesg.type === 'buf') {
        const controller = controllerMap.get(mesg.id);
        controller.enqueue(new Uint8Array(mesg.buf, mesg.offset, mesg.len));
    } else if (mesg.type === 'end') {
        const controller = controllerMap.get(mesg.id);
        controller.close();
    } else if (mesg.type === 'err') {
        const controller = controllerMap.get(mesg.id);
        const err = mesg.err instanceof Error ? mesg.err : new Error(String(mesg.err));
        controller.error(err);
    }
});
