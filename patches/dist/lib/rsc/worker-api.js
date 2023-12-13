const messageCallbacks = new Map();
let lastWorker;
const getWorker = ()=>{
    if (lastWorker) {
        return lastWorker;
    }
    return lastWorker = new Promise((resolve, reject)=>{
        import('node:worker_threads').then(({ Worker })=>{
            const IS_NODE_18 = Number(process.versions.node.split('.')[0]) < 20;
            const worker = new Worker(new URL('worker-impl.js', import.meta.url), {
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
export async function registerReloadCallback(fn) {
    const worker = await getWorker();
    const listener = (mesg)=>{
        if (mesg.type === 'full-reload') {
            fn(mesg.type);
        }
    };
    worker.on('message', listener);
    return ()=>worker.off('message', listener);
}
export async function registerImportCallback(fn) {
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
export async function renderRscWithWorker(rr) {
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
