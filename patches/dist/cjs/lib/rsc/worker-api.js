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
    registerImportCallback: function() {
        return registerImportCallback;
    },
    registerReloadCallback: function() {
        return registerReloadCallback;
    },
    renderRscWithWorker: function() {
        return renderRscWithWorker;
    }
});
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
const messageCallbacks = new Map();
let lastWorker;
const getWorker = ()=>{
    if (lastWorker) {
        return lastWorker;
    }
    return lastWorker = new Promise((resolve, reject)=>{
        Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:worker_threads"))).then(({ Worker })=>{
            const IS_NODE_18 = Number(process.versions.node.split('.')[0]) < 20;
            const worker = new Worker(new URL('worker-impl.js', require("url").pathToFileURL(__filename).toString()), {
                execArgv: [
                    ...IS_NODE_18 ? [
                        '--experimental-loader',
                        'waku/node-loader'
                    ] : [],
                    '--conditions',
                    'react-server'
                ]
            });
            worker.on('message', (mesg)=>{
                if ('id' in mesg) {
                    messageCallbacks.get(mesg.id)?.(mesg);
                }
            });
            resolve(worker);
        }).catch((e)=>reject(e));
    });
};
async function registerReloadCallback(fn) {
    const worker = await getWorker();
    const listener = (mesg)=>{
        if (mesg.type === 'full-reload') {
            fn(mesg.type);
        }
    };
    worker.on('message', listener);
    return ()=>worker.off('message', listener);
}
async function registerImportCallback(fn) {
    const worker = await getWorker();
    const listener = (mesg)=>{
        if (mesg.type === 'hot-import') {
            fn(mesg.source);
        }
    };
    worker.on('message', listener);
    return ()=>worker.off('message', listener);
}
let nextId = 1;
async function renderRscWithWorker(rr) {
    const worker = await getWorker();
    const id = nextId++;
    const pipe = async ()=>{
        if (rr.stream) {
            const reader = rr.stream.getReader();
            try {
                let result;
                do {
                    result = await reader.read();
                    if (result.value) {
                        const buf = result.value;
                        let mesg;
                        if (buf instanceof ArrayBuffer) {
                            mesg = {
                                id,
                                type: 'buf',
                                buf,
                                offset: 0,
                                len: buf.byteLength
                            };
                        } else if (buf instanceof Uint8Array) {
                            mesg = {
                                id,
                                type: 'buf',
                                buf: buf.buffer,
                                offset: buf.byteOffset,
                                len: buf.byteLength
                            };
                        } else {
                            throw new Error('Unexepected buffer type');
                        }
                        worker.postMessage(mesg, [
                            mesg.buf
                        ]);
                    }
                }while (!result.done)
            } catch (err) {
                const mesg = {
                    id,
                    type: 'err',
                    err
                };
                worker.postMessage(mesg);
            }
        }
        const mesg = {
            id,
            type: 'end'
        };
        worker.postMessage(mesg);
    };
    let started = false;
    return new Promise((resolve, reject)=>{
        let controller;
        const stream = new ReadableStream({
            start (c) {
                controller = c;
            }
        });
        messageCallbacks.set(id, (mesg)=>{
            if (mesg.type === 'start') {
                if (!started) {
                    started = true;
                    resolve([
                        stream,
                        mesg.context
                    ]);
                } else {
                    throw new Error('already started');
                }
            } else if (mesg.type === 'buf') {
                if (!started) {
                    throw new Error('not yet started');
                }
                controller.enqueue(new Uint8Array(mesg.buf, mesg.offset, mesg.len));
            } else if (mesg.type === 'moduleId') {
                rr.moduleIdCallback?.(mesg.moduleId);
            } else if (mesg.type === 'end') {
                if (!started) {
                    throw new Error('not yet started');
                }
                controller.close();
                messageCallbacks.delete(id);
            } else if (mesg.type === 'err') {
                const err = mesg.err instanceof Error ? mesg.err : new Error(String(mesg.err));
                if (mesg.statusCode) {
                    err.statusCode = mesg.statusCode;
                }
                if (!started) {
                    reject(err);
                } else {
                    controller.error(err);
                }
                messageCallbacks.delete(id);
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ssr: _removed, ...copiedConfig } = rr.config; // HACK type
        const copied = {
            ...rr,
            config: copiedConfig
        };
        delete copied.stream;
        delete copied.moduleIdCallback;
        const mesg = {
            id,
            type: 'render',
            hasModuleIdCallback: !!rr.moduleIdCallback,
            ...copied
        };
        worker.postMessage(mesg);
        pipe();
    });
}
