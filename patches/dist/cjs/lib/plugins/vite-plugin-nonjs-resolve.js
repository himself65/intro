"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nonjsResolvePlugin", {
    enumerable: true,
    get: function() {
        return nonjsResolvePlugin;
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
function nonjsResolvePlugin() {
    return {
        name: 'nonjs-resolve-plugin',
        async resolveId (id, importer, options) {
            const path = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:path"))).catch((e)=>{
                // XXX explicit catch to avoid bundle time error
                throw e;
            });
            if (!options.ssr) {
                return id;
            }
            if (!id.endsWith('.js')) {
                return id;
            }
            for (const ext of [
                '.js',
                '.ts',
                '.tsx',
                '.jsx',
                '.mjs',
                '.cjs'
            ]){
                const resolved = await this.resolve(id.slice(0, -path.extname(id).length) + ext, importer, options);
                if (resolved) {
                    return resolved;
                }
            }
        }
    };
}
