import { encodeFilePathToAbsolute, filePathToFileURL, fileURLToFilePath } from '../utils/path.js';
import { parseFormData } from '../utils/form.js';
import { streamToString } from '../utils/stream.js';
export const RSDW_SERVER_MODULE = 'rsdw-server';
export const RSDW_SERVER_MODULE_VALUE = 'react-server-dom-webpack/server.edge';
const resolveClientEntry = (file, config, isDev)=>{
    if (isDev) {
        const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
        // HACK this relies on Vite's internal implementation detail.
        return config.basePath + '@fs' + encodeFilePathToAbsolute(filePath);
    }
    if (!file.startsWith('@id/')) {
        throw new Error('Unexpected client entry in PRD');
    }
    return config.basePath + file.slice('@id/'.length);
};
export async function renderRsc(opts) {
    const { config, input, method, contentType, context, body, moduleIdCallback, isDev, entries } = opts;
    const { default: { renderEntries }, loadModule } = entries;
    const { renderToReadableStream, decodeReply } = await (isDev ? import(RSDW_SERVER_MODULE_VALUE) : loadModule(RSDW_SERVER_MODULE).then((m)=>m.default));
    const render = async (renderContext, input)=>{
        const elements = await renderEntries.call(renderContext, input);
        if (elements === null) {
            const err = new Error('No function component found');
            err.statusCode = 404; // HACK our convention for NotFound
            throw err;
        }
        if (Object.keys(elements).some((key)=>key.startsWith('_'))) {
            throw new Error('"_" prefix is reserved');
        }
        return elements;
    };
    const bundlerConfig = new Proxy({}, {
        get (_target, encodedId) {
            const [file, name] = encodedId.split('#');
            const id = resolveClientEntry(file, config, isDev);
            moduleIdCallback?.(id);
            return {
                id,
                chunks: [
                    id
                ],
                name,
                async: true
            };
        }
    });
    if (method === 'POST') {
        const rsfId = decodeURIComponent(input);
        let args = [];
        let bodyStr = '';
        if (body) {
            bodyStr = await streamToString(body);
        }
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = parseFormData(bodyStr, contentType);
            args = await decodeReply(formData);
        } else if (bodyStr) {
            args = await decodeReply(bodyStr);
        }
        const [fileId, name] = rsfId.split('#');
        let mod;
        if (isDev) {
            mod = await opts.customImport(filePathToFileURL(fileId));
        } else {
            if (!fileId.startsWith('@id/')) {
                throw new Error('Unexpected server entry in PRD');
            }
            mod = await loadModule(fileId.slice('@id/'.length));
        }
        const fn = mod[name] || mod;
        let elements = Promise.resolve({});
        let rendered = false;
        const rerender = (input)=>{
            if (rendered) {
                throw new Error('already rendered');
            }
            const renderContext = {
                rerender,
                context
            };
            elements = Promise.all([
                elements,
                render(renderContext, input)
            ]).then(([oldElements, newElements])=>({
                    ...oldElements,
                    ...newElements
                }));
        };
        const renderContext = {
            rerender,
            context
        };
        const data = await fn.apply(renderContext, args);
        const resolvedElements = await elements;
        rendered = true;
        return renderToReadableStream({
            ...resolvedElements,
            _value: data
        }, bundlerConfig);
    }
    // rr.method === 'GET'
    const renderContext = {
        rerender: ()=>{
            throw new Error('Cannot rerender');
        },
        context
    };
    const elements = await render(renderContext, input);
    return renderToReadableStream(elements, bundlerConfig);
}
export async function getBuildConfig(opts) {
    const { config, entries } = opts;
    const { default: { getBuildConfig } } = entries;
    if (!getBuildConfig) {
        console.warn("getBuildConfig is undefined. It's recommended for optimization and sometimes required.");
        return {};
    }
    const unstable_collectClientModules = async (input)=>{
        const idSet = new Set();
        const readable = await renderRsc({
            config,
            input,
            method: 'GET',
            context: null,
            moduleIdCallback: (id)=>idSet.add(id),
            isDev: false,
            entries
        });
        await new Promise((resolve, reject)=>{
            const writable = new WritableStream({
                close () {
                    resolve();
                },
                abort (reason) {
                    reject(reason);
                }
            });
            readable.pipeTo(writable);
        });
        return Array.from(idSet);
    };
    const output = await getBuildConfig(unstable_collectClientModules);
    return output;
}
