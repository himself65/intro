"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "rscDelegatePlugin", {
    enumerable: true,
    get: function() {
        return rscDelegatePlugin;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _core = /*#__PURE__*/ _interop_require_wildcard(require("@swc/core"));
const _path = require("../utils/path.js");
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
// import { CSS_LANGS_RE } from "vite/dist/node/constants.js";
const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
function rscDelegatePlugin(importCallback) {
    let mode = 'development';
    let base = '/';
    return {
        name: 'rsc-delegate-plugin',
        configResolved (config) {
            mode = config.mode;
            base = config.base;
        },
        transform (code, id) {
            const ext = _nodepath.default.extname(id);
            if (mode === 'development' && [
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
                    if (item.type === 'ImportDeclaration') {
                        if (item.source.value.startsWith('virtual:')) {
                            // HACK this relies on Vite's internal implementation detail.
                            const source = base + '@id/__x00__' + item.source.value;
                            importCallback(source);
                        } else if (CSS_LANGS_RE.test(item.source.value)) {
                            const filePath = _nodepath.default.join(_nodepath.default.dirname(id), item.source.value);
                            // HACK this relies on Vite's internal implementation detail.
                            const source = base + '@fs' + (0, _path.encodeFilePathToAbsolute)(filePath);
                            importCallback(source);
                        }
                    }
                }
            }
            return code;
        }
    };
}
