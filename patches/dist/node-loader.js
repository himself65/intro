/**
 * We manually call the hooks on react-server-dom-webpack/node-loader.
 * 1. `react-server-dom-webpack/node-loader` uses Node.js 18 deprecated API.
 * 2. `conditions` will not be read in ESM,
 *      which will lead to a React warning on Node.js 20.
 *      Refs: https://github.com/nodejs/node/issues/50885
 */ import * as RSDWNodeLoader from 'react-server-dom-webpack/node-loader';
export const load = async (url, context, nextLoad)=>{
    return RSDWNodeLoader.load(url, context, async (reqUrl, context)=>{
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
export const resolve = async (specifier, context, nextResolve)=>{
    return RSDWNodeLoader.resolve(specifier, {
        ...context,
        conditions: [
            ...context.conditions,
            'react-server'
        ]
    }, nextResolve);
};
