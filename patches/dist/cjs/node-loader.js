/**
 * We manually call the hooks on react-server-dom-webpack/node-loader.
 * 1. `react-server-dom-webpack/node-loader` uses Node.js 18 deprecated API.
 * 2. `conditions` will not be read in ESM,
 *      which will lead to a React warning on Node.js 20.
 *      Refs: https://github.com/nodejs/node/issues/50885
 */ "use strict";
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
    load: function() {
        return load;
    },
    resolve: function() {
        return resolve;
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
const load = async (url, context, nextLoad)=>{
    return _nodeloader.load(url, context, async (reqUrl, context)=>{
        const result = await nextLoad(reqUrl, context);
        if (result.format === 'module') {
            let { source } = result;
            if (source && typeof source !== 'string') {
                source = source.toString();
                return {
                    ...result,
                    source
                };
            }
        }
        return result;
    });
};
const resolve = async (specifier, context, nextResolve)=>{
    return _nodeloader.resolve(specifier, {
        ...context,
        conditions: [
            ...context.conditions,
            'react-server'
        ]
    }, nextResolve);
};
