// This file should not include Node specific code.
export const encodeInput = (input)=>{
    if (input === '') {
        return '_';
    } else if (!input.startsWith('_')) {
        return input;
    }
    throw new Error("Input must not start with '_'");
};
export const decodeInput = (encodedInput)=>{
    if (encodedInput === '_') {
        return '';
    } else if (!encodedInput.startsWith('_')) {
        return encodedInput;
    }
    throw new Error('Invalid encoded input');
};
export const hasStatusCode = (x)=>typeof x?.statusCode === 'number';
export const codeToInject = `
globalThis.__waku_module_cache__ = new Map();
globalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));
globalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);`;
export const generatePrefetchCode = (basePrefix, inputs, moduleIds)=>{
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
export const deepFreeze = (x)=>{
    if (typeof x === 'object' && x !== null) {
        Object.freeze(x);
        for (const value of Object.values(x)){
            deepFreeze(value);
        }
    }
};
