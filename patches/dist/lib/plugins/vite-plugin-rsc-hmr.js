import path from 'node:path';
const customCode = `
if (import.meta.hot && !globalThis.__WAKU_HMR_CONFIGURED__) {
  globalThis.__WAKU_HMR_CONFIGURED__ = true;
  import.meta.hot.on('hot-import', (data) => import(/* @vite-ignore */ data));
}
`;
export function rscHmrPlugin() {
    return {
        name: 'rsc-hmr-plugin',
        async transform (code, id) {
            const ext = path.extname(id);
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
export function hotImport(vite, source) {
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
