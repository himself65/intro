// This file should not include Node specific code.
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
    codeToInject: function() {
        return codeToInject;
    },
    decodeInput: function() {
        return decodeInput;
    },
    deepFreeze: function() {
        return deepFreeze;
    },
    encodeInput: function() {
        return encodeInput;
    },
    generatePrefetchCode: function() {
        return generatePrefetchCode;
    },
    hasStatusCode: function() {
        return hasStatusCode;
    }
});
const encodeInput = (input)=>{
    if (input === '') {
        return '_';
    } else if (!input.startsWith('_')) {
        return input;
    }
    throw new Error("Input must not start with '_'");
};
const decodeInput = (encodedInput)=>{
    if (encodedInput === '_') {
        return '';
    } else if (!encodedInput.startsWith('_')) {
        return encodedInput;
    }
    throw new Error('Invalid encoded input');
};
const hasStatusCode = (x)=>typeof x?.statusCode === 'number';
const codeToInject = `
globalThis.__waku_module_cache__ = new Map();
globalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));
globalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);`;
const generatePrefetchCode = (basePrefix, inputs, moduleIds)=>{
    const inputsArray = Array.from(inputs);
    let code = '';
    if (inputsArray.length) {
        code += `
globalThis.__WAKU_PREFETCHED__ = {
${inputsArray.map((input)=>`  '${input}': fetch('${basePrefix}${encodeInput(input)}')`).join(',\n')}
};`;
    }
    for (const moduleId of moduleIds){
        code += `
import('${moduleId}');`;
    }
    return code;
};
const deepFreeze = (x)=>{
    if (typeof x === 'object' && x !== null) {
        Object.freeze(x);
        for (const value of Object.values(x)){
            deepFreeze(value);
        }
    }
};
