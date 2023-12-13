"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "rscTransformPlugin", {
    enumerable: true,
    get: function() {
        return rscTransformPlugin;
    }
});
const _nodeloader = /*#__PURE__*/ _interop_require_wildcard(require("react-server-dom-webpack/node-loader"));
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
function rscTransformPlugin(isBuild, assetsDir, clientEntryFiles, serverEntryFiles) {
    const clientFileMap = new Map();
    const serverFileMap = new Map();
    const getClientId = (id)=>{
        if (!assetsDir) {
            throw new Error('assetsDir is required');
        }
        if (!clientFileMap.has(id)) {
            throw new Error(`Cannot find client id for ${id}`);
        }
        return `@id/${assetsDir}/${clientFileMap.get(id)}.js`;
    };
    const getServerId = (id)=>{
        if (!assetsDir) {
            throw new Error('assetsDir is required');
        }
        if (!serverFileMap.has(id)) {
            throw new Error(`Cannot find server id for ${id}`);
        }
        return `@id/${assetsDir}/${serverFileMap.get(id)}.js`;
    };
    let buildStarted = false;
    return {
        name: 'rsc-transform-plugin',
        async buildStart () {
            for (const [k, v] of Object.entries(clientEntryFiles || {})){
                const resolvedId = await this.resolve(v);
                if (!resolvedId) {
                    throw new Error(`Cannot resolve ${v}`);
                }
                clientFileMap.set(resolvedId.id, k);
            }
            for (const [k, v] of Object.entries(serverEntryFiles || {})){
                serverFileMap.set(v, k);
            }
            // HACK Without checking buildStarted in transform,
            // this.resolve calls transform, and getClientId throws an error.
            buildStarted = true;
        },
        async transform (code, id) {
            const resolve = async (specifier, { parentURL })=>{
                if (!specifier) {
                    return {
                        url: ''
                    };
                }
                const url = (await this.resolve(specifier, parentURL)).id;
                return {
                    url
                };
            };
            const load = async (url)=>{
                let source = url === id ? code : (await this.load({
                    id: url
                })).code;
                // HACK move directives before import statements.
                source = source.replace(/^(import {.*?} from ".*?";)\s*"use (client|server)";/, '"use $2";$1');
                return {
                    format: 'module',
                    source
                };
            };
            _nodeloader.resolve('', {
                conditions: [
                    'react-server',
                    'workerd'
                ],
                parentURL: ''
            }, resolve);
            let { source } = await _nodeloader.load(id, null, load);
            if (isBuild && buildStarted) {
                // TODO we should parse the source code by ourselves with SWC
                if (/^import {registerClientReference} from "react-server-dom-webpack\/server";/.test(source)) {
                    // HACK tweak registerClientReference for production
                    source = source.replace(/registerClientReference\(function\(\) {throw new Error\("([^"]*)"\);},"[^"]*","([^"]*)"\);/gs, `registerClientReference(function() {return "$1";}, "${getClientId(id)}", "$2");`);
                }
                if (/;import {registerServerReference} from "react-server-dom-webpack\/server";/.test(source)) {
                    // HACK tweak registerServerReference for production
                    source = source.replace(/registerServerReference\(([^,]*),"[^"]*","([^"]*)"\);/gs, `registerServerReference($1, "${getServerId(id)}", "$2");`);
                }
            }
            return source;
        }
    };
}
