"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "rscReloadPlugin", {
    enumerable: true,
    get: function() {
        return rscReloadPlugin;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _core = /*#__PURE__*/ _interop_require_wildcard(require("@swc/core"));
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
function rscReloadPlugin(fn) {
    let enabled = false;
    const isClientEntry = (id, code)=>{
        const ext = _nodepath.default.extname(id);
        if ([
            '.ts',
            '.tsx',
            '.js',
            '.jsx'
        ].includes(ext)) {
            const mod = _core.parseSync(code, {
                syntax: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'ecmascript',
                tsx: ext === '.tsx'
            });
            for (const item of mod.body){
                if (item.type === 'ExpressionStatement' && item.expression.type === 'StringLiteral' && item.expression.value === 'use client') {
                    return true;
                }
            }
        }
        return false;
    };
    return {
        name: 'rsc-reload-plugin',
        configResolved (config) {
            if (config.mode === 'development') {
                enabled = true;
            }
        },
        async handleHotUpdate (ctx) {
            if (!enabled) {
                return [];
            }
            if (ctx.modules.length && !isClientEntry(ctx.file, await ctx.read())) {
                fn('full-reload');
            } else {
                return [];
            }
        }
    };
}
