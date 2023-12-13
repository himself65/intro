"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "rscAnalyzePlugin", {
    enumerable: true,
    get: function() {
        return rscAnalyzePlugin;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _nodefs = require("node:fs");
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
function rscAnalyzePlugin(commonFileSet, clientFileSet, serverFileSet) {
    const dependencyMap = new Map();
    const clientEntryCallback = (id)=>clientFileSet.add(id);
    const serverEntryCallback = (id)=>serverFileSet.add(id);
    const dependencyCallback = (id, depId)=>{
        let depSet = dependencyMap.get(id);
        if (!depSet) {
            depSet = new Set();
            dependencyMap.set(id, depSet);
        }
        depSet.add(depId);
    };
    return {
        name: 'rsc-analyze-plugin',
        async transform (code, id) {
            const ext = _nodepath.default.extname(id);
            if ([
                '.ts',
                '.tsx',
                '.js',
                '.jsx',
                '.mjs'
            ].includes(ext)) {
                const mod = _core.parseSync(code, {
                    syntax: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'ecmascript',
                    tsx: ext === '.tsx'
                });
                for (const item of mod.body){
                    if (item.type === 'ExpressionStatement' && item.expression.type === 'StringLiteral') {
                        if (item.expression.value === 'use client') {
                            clientEntryCallback(id);
                        } else if (item.expression.value === 'use server') {
                            serverEntryCallback(id);
                        }
                    }
                    if (item.type === 'ImportDeclaration') {
                        const resolvedId = await this.resolve(item.source.value, id);
                        if (resolvedId) {
                            dependencyCallback(id, resolvedId.id);
                        }
                    }
                }
            }
            return code;
        },
        generateBundle (_options, bundle) {
            // TODO the logic in this function should probably be redesigned.
            const outputIds = Object.values(bundle).flatMap((item)=>'facadeModuleId' in item && item.facadeModuleId ? [
                    item.facadeModuleId
                ] : []);
            const possibleCommonFileMap = new Map();
            const seen = new Set();
            const loop = (id, isClient)=>{
                if (seen.has(id)) {
                    return;
                }
                seen.add(id);
                isClient = isClient || clientFileSet.has(id);
                for (const depId of dependencyMap.get(id) ?? []){
                    if (!(0, _nodefs.existsSync)(depId)) {
                        // HACK is there a better way?
                        return;
                    }
                    let value = possibleCommonFileMap.get(depId);
                    if (!value) {
                        value = {};
                        possibleCommonFileMap.set(depId, value);
                    }
                    if (isClient) {
                        value.fromClient = true;
                    } else {
                        value.notFromClient = true;
                    }
                    loop(depId, isClient);
                }
            };
            for (const id of outputIds){
                loop(id, false);
            }
            for (const id of clientFileSet){
                loop(id, true);
            }
            for (const id of serverFileSet){
                loop(id, false);
            }
            for (const [id, val] of possibleCommonFileMap){
                if (val.fromClient && val.notFromClient) {
                    commonFileSet.add(id);
                }
            }
            for (const id of clientFileSet){
                commonFileSet.delete(id);
            }
            for (const id of serverFileSet){
                commonFileSet.delete(id);
            }
        }
    };
}
