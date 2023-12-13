export declare const encodeInput: (input: string) => string;
export declare const decodeInput: (encodedInput: string) => string;
export declare const hasStatusCode: (x: unknown) => x is {
    statusCode: number;
};
export declare const codeToInject = "\nglobalThis.__waku_module_cache__ = new Map();\nglobalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));\nglobalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);";
export declare const generatePrefetchCode: (basePrefix: string, inputs: Iterable<string>, moduleIds: Iterable<string>) => string;
export declare const deepFreeze: (x: unknown) => void;
