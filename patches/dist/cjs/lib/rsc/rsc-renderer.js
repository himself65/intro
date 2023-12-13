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
    RSDW_SERVER_MODULE: function() {
        return RSDW_SERVER_MODULE;
    },
    RSDW_SERVER_MODULE_VALUE: function() {
        return RSDW_SERVER_MODULE_VALUE;
    },
    getBuildConfig: function() {
        return getBuildConfig;
    },
    renderRsc: function() {
        return renderRsc;
    }
});
const _path = require("../utils/path.js");
const _form = require("../utils/form.js");
const _stream = require("../utils/stream.js");
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
const RSDW_SERVER_MODULE = 'rsdw-server';
const RSDW_SERVER_MODULE_VALUE = 'react-server-dom-webpack/server.edge';
const resolveClientEntry = (file, config, isDev)=>{
    if (isDev) {
        const filePath = file.startsWith('file://') ? (0, _path.fileURLToFilePath)(file) : file;
        // HACK this relies on Vite's internal implementation detail.
        return config.basePath + '@fs' + (0, _path.encodeFilePathToAbsolute)(filePath);
    }
    if (!file.startsWith('@id/')) {
        throw new Error('Unexpected client entry in PRD');
    }
    return config.basePath + file.slice('@id/'.length);
};
async function renderRsc(opts) {
    const { config, input, method, contentType, context, body, moduleIdCallback, isDev, entries } = opts;
    const { default: { renderEntries }, loadModule } = entries;
    const { renderToReadableStream, decodeReply } = await (isDev ? Promise.resolve(RSDW_SERVER_MODULE_VALUE).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p))) : loadModule(RSDW_SERVER_MODULE).then((m)=>m.default));
    const render = async (renderContext, input)=>{
        const elements = await renderEntries.call(renderContext, input);
        if (elements === null) {
            const err = new Error('No function component found');
            err.statusCode = 404; // HACK our convention for NotFound
            throw err;
        }
        if (Object.keys(elements).some((key)=>key.startsWith('_'))) {
            throw new Error('"_" prefix is reserved');
        }
        return elements;
    };
    const bundlerConfig = new Proxy({}, {
        get (_target, encodedId) {
            const [file, name] = encodedId.split('#');
            const id = resolveClientEntry(file, config, isDev);
            moduleIdCallback?.(id);
            return {
                id,
                chunks: [
                    id
                ],
                name,
                async: true
            };
        }
    });
    if (method === 'POST') {
        const rsfId = decodeURIComponent(input);
        let args = [];
        let bodyStr = '';
        if (body) {
            bodyStr = await (0, _stream.streamToString)(body);
        }
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = (0, _form.parseFormData)(bodyStr, contentType);
            args = await decodeReply(formData);
        } else if (bodyStr) {
            args = await decodeReply(bodyStr);
        }
        const [fileId, name] = rsfId.split('#');
        let mod;
        if (isDev) {
            mod = await opts.customImport((0, _path.filePathToFileURL)(fileId));
        } else {
            if (!fileId.startsWith('@id/')) {
                throw new Error('Unexpected server entry in PRD');
            }
            mod = await loadModule(fileId.slice('@id/'.length));
        }
        const fn = mod[name] || mod;
        let elements = Promise.resolve({});
        let rendered = false;
        const rerender = (input)=>{
            if (rendered) {
                throw new Error('already rendered');
            }
            const renderContext = {
                rerender,
                context
            };
            elements = Promise.all([
                elements,
                render(renderContext, input)
            ]).then(([oldElements, newElements])=>({
                    ...oldElements,
                    ...newElements
                }));
        };
        const renderContext = {
            rerender,
            context
        };
        const data = await fn.apply(renderContext, args);
        const resolvedElements = await elements;
        rendered = true;
        return renderToReadableStream({
            ...resolvedElements,
            _value: data
        }, bundlerConfig);
    }
    // rr.method === 'GET'
    const renderContext = {
        rerender: ()=>{
            throw new Error('Cannot rerender');
        },
        context
    };
    const elements = await render(renderContext, input);
    return renderToReadableStream(elements, bundlerConfig);
}
async function getBuildConfig(opts) {
    const { config, entries } = opts;
    const { default: { getBuildConfig } } = entries;
    if (!getBuildConfig) {
        console.warn("getBuildConfig is undefined. It's recommended for optimization and sometimes required.");
        return {};
    }
    const unstable_collectClientModules = async (input)=>{
        const idSet = new Set();
        const readable = await renderRsc({
            config,
            input,
            method: 'GET',
            context: null,
            moduleIdCallback: (id)=>idSet.add(id),
            isDev: false,
            entries
        });
        await new Promise((resolve, reject)=>{
            const writable = new WritableStream({
                close () {
                    resolve();
                },
                abort (reason) {
                    reject(reason);
                }
            });
            readable.pipeTo(writable);
        });
        return Array.from(idSet);
    };
    const output = await getBuildConfig(unstable_collectClientModules);
    return output;
}
