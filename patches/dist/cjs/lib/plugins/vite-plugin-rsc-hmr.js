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
    hotImport: function() {
        return hotImport;
    },
    rscHmrPlugin: function() {
        return rscHmrPlugin;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const customCode = `
if (import.meta.hot && !globalThis.__WAKU_HMR_CONFIGURED__) {
  globalThis.__WAKU_HMR_CONFIGURED__ = true;
  import.meta.hot.on('hot-import', (data) => import(/* @vite-ignore */ data));
}
`;
function rscHmrPlugin() {
    return {
        name: 'rsc-hmr-plugin',
        async transform (code, id) {
            const ext = _nodepath.default.extname(id);
            if ([
                '.ts',
                '.tsx',
                '.js',
                '.jsx'
            ].includes(ext)) {
                return code + customCode;
            }
            return code;
        }
    };
}
const pendingMap = new WeakMap();
function hotImport(vite, source) {
    let sourceSet = pendingMap.get(vite);
    if (!sourceSet) {
        sourceSet = new Set();
        pendingMap.set(vite, sourceSet);
        vite.ws.on('connection', ()=>{
            for (const source of sourceSet){
                vite.ws.send({
                    type: 'custom',
                    event: 'hot-import',
                    data: source
                });
            }
        });
    }
    sourceSet.add(source);
    vite.ws.send({
        type: 'custom',
        event: 'hot-import',
        data: source
    });
}
