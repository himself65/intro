"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "build", {
    enumerable: true,
    get: function() {
        return build;
    }
});
const _nodecrypto = require("node:crypto");
const _nodestream = require("node:stream");
const _promises = require("node:stream/promises");
const _vite = require("vite");
const _pluginreact = /*#__PURE__*/ _interop_require_default(require("@vitejs/plugin-react"));
const _config = require("./config.js");
const _path = require("./utils/path.js");
const _nodefs = require("./utils/node-fs.js");
const _stream = require("./utils/stream.js");
const _utils = require("./rsc/utils.js");
const _rscrenderer = require("./rsc/rsc-renderer.js");
const _htmlrenderer = require("./rsc/html-renderer.js");
const _vitepluginrscindex = require("./plugins/vite-plugin-rsc-index.js");
const _vitepluginrscanalyze = require("./plugins/vite-plugin-rsc-analyze.js");
const _vitepluginnonjsresolve = require("./plugins/vite-plugin-nonjs-resolve.js");
const _vitepluginrsctransform = require("./plugins/vite-plugin-rsc-transform.js");
const _patchreactrefresh = require("./plugins/patch-react-refresh.js");
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
// TODO this file and functions in it are too long. will fix.
// Upstream issue: https://github.com/rollup/rollup/issues/4699
const onwarn = (warning, defaultHandler)=>{
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && /"use (client|server)"/.test(warning.message)) {
        return;
    } else if (warning.code === 'SOURCEMAP_ERROR' && warning.loc?.file?.endsWith('.tsx') && warning.loc?.column === 0 && warning.loc?.line === 1) {
        return;
    }
    defaultHandler(warning);
};
const hash = (fname)=>new Promise((resolve)=>{
        const sha256 = (0, _nodecrypto.createHash)('sha256');
        sha256.on('readable', ()=>{
            const data = sha256.read();
            if (data) {
                resolve(data.toString('hex').slice(0, 9));
            }
        });
        (0, _nodefs.createReadStream)(fname).pipe(sha256);
    });
const analyzeEntries = async (entriesFile)=>{
    const commonFileSet = new Set();
    const clientFileSet = new Set();
    const serverFileSet = new Set();
    await (0, _vite.build)({
        plugins: [
            (0, _vitepluginrscanalyze.rscAnalyzePlugin)(commonFileSet, clientFileSet, serverFileSet)
        ],
        ssr: {
            resolve: {
                conditions: [
                    'react-server',
                    'workerd'
                ],
                externalConditions: [
                    'react-server',
                    'workerd'
                ]
            },
            noExternal: /^(?!node:)/
        },
        build: {
            write: false,
            ssr: true,
            rollupOptions: {
                onwarn,
                input: {
                    entries: entriesFile
                }
            }
        }
    });
    const commonEntryFiles = Object.fromEntries(await Promise.all(Array.from(commonFileSet).map(async (fname, i)=>[
            `com${i}-${await hash(fname)}`,
            fname
        ])));
    const clientEntryFiles = Object.fromEntries(await Promise.all(Array.from(clientFileSet).map(async (fname, i)=>[
            `rsc${i}-${await hash(fname)}`,
            fname
        ])));
    const serverEntryFiles = Object.fromEntries(Array.from(serverFileSet).map((fname, i)=>[
            `rsf${i}`,
            fname
        ]));
    return {
        commonEntryFiles,
        clientEntryFiles,
        serverEntryFiles
    };
};
const buildServerBundle = async (rootDir, config, entriesFile, distEntriesFile, commonEntryFiles, clientEntryFiles, serverEntryFiles)=>{
    const serverBuildOutput = await (0, _vite.build)({
        plugins: [
            (0, _vitepluginnonjsresolve.nonjsResolvePlugin)(),
            (0, _vitepluginrsctransform.rscTransformPlugin)(true, config.assetsDir, {
                [_htmlrenderer.WAKU_CLIENT_MODULE]: _htmlrenderer.WAKU_CLIENT_MODULE_VALUE,
                ...clientEntryFiles
            }, serverEntryFiles)
        ],
        ssr: {
            resolve: {
                conditions: [
                    'react-server',
                    'workerd'
                ],
                externalConditions: [
                    'react-server',
                    'workerd'
                ]
            },
            noExternal: /^(?!node:)/
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production')
        },
        publicDir: false,
        build: {
            ssr: true,
            ssrEmitAssets: true,
            outDir: (0, _path.joinPath)(rootDir, config.distDir),
            rollupOptions: {
                onwarn,
                input: {
                    entries: entriesFile,
                    [_rscrenderer.RSDW_SERVER_MODULE]: _rscrenderer.RSDW_SERVER_MODULE_VALUE,
                    [_htmlrenderer.WAKU_CLIENT_MODULE]: _htmlrenderer.WAKU_CLIENT_MODULE_VALUE,
                    ...commonEntryFiles,
                    ...clientEntryFiles,
                    ...serverEntryFiles
                },
                output: {
                    entryFileNames: (chunkInfo)=>{
                        if ([
                            _htmlrenderer.WAKU_CLIENT_MODULE
                        ].includes(chunkInfo.name) || commonEntryFiles[chunkInfo.name] || clientEntryFiles[chunkInfo.name] || serverEntryFiles[chunkInfo.name]) {
                            return config.assetsDir + '/[name].js';
                        }
                        return '[name].js';
                    }
                }
            }
        }
    });
    if (!('output' in serverBuildOutput)) {
        throw new Error('Unexpected vite server build output');
    }
    const psDir = (0, _path.joinPath)(config.publicDir, config.assetsDir);
    const code = `
export function loadModule(id) {
  switch (id) {
    case '${_rscrenderer.RSDW_SERVER_MODULE}':
      return import('./${_rscrenderer.RSDW_SERVER_MODULE}.js');
    case 'public/${_htmlrenderer.REACT_MODULE}':
      return import('./${psDir}/${_htmlrenderer.REACT_MODULE}.js');
    case 'public/${_htmlrenderer.RD_SERVER_MODULE}':
      return import('./${psDir}/${_htmlrenderer.RD_SERVER_MODULE}.js');
    case 'public/${_htmlrenderer.RSDW_CLIENT_MODULE}':
      return import('./${psDir}/${_htmlrenderer.RSDW_CLIENT_MODULE}.js');
    case 'public/${_htmlrenderer.WAKU_CLIENT_MODULE}':
      return import('./${psDir}/${_htmlrenderer.WAKU_CLIENT_MODULE}.js');
${Object.entries(serverEntryFiles || {}).map(([k])=>`
    case '${config.assetsDir}/${k}.js':
      return import('./${config.assetsDir}/${k}.js');`).join('')}
${Object.entries(clientEntryFiles || {}).map(([k])=>`
    case 'public/${config.assetsDir}/${k}.js':
      return import('./${psDir}/${k}.js');`).join('')}
    default:
      throw new Error('Cannot find module: ' + id);
  }
}
`;
    await (0, _nodefs.appendFile)(distEntriesFile, code);
    return serverBuildOutput;
};
const buildClientBundle = async (rootDir, config, commonEntryFiles, clientEntryFiles, serverBuildOutput)=>{
    const indexHtmlFile = (0, _path.joinPath)(rootDir, config.indexHtml);
    const cssAssets = serverBuildOutput.output.flatMap(({ type, fileName })=>type === 'asset' && fileName.endsWith('.css') ? [
            fileName
        ] : []);
    const clientBuildOutput = await (0, _vite.build)({
        base: config.basePath,
        plugins: [
            (0, _patchreactrefresh.patchReactRefresh)((0, _pluginreact.default)()),
            (0, _vitepluginrscindex.rscIndexPlugin)(cssAssets)
        ],
        build: {
            outDir: (0, _path.joinPath)(rootDir, config.distDir, config.publicDir),
            rollupOptions: {
                onwarn,
                input: {
                    main: indexHtmlFile,
                    [_htmlrenderer.REACT_MODULE]: _htmlrenderer.REACT_MODULE_VALUE,
                    [_htmlrenderer.RD_SERVER_MODULE]: _htmlrenderer.RD_SERVER_MODULE_VALUE,
                    [_htmlrenderer.RSDW_CLIENT_MODULE]: _htmlrenderer.RSDW_CLIENT_MODULE_VALUE,
                    [_htmlrenderer.WAKU_CLIENT_MODULE]: _htmlrenderer.WAKU_CLIENT_MODULE_VALUE,
                    ...commonEntryFiles,
                    ...clientEntryFiles
                },
                preserveEntrySignatures: 'exports-only',
                output: {
                    entryFileNames: (chunkInfo)=>{
                        if ([
                            _htmlrenderer.REACT_MODULE,
                            _htmlrenderer.RD_SERVER_MODULE,
                            _htmlrenderer.RSDW_CLIENT_MODULE,
                            _htmlrenderer.WAKU_CLIENT_MODULE
                        ].includes(chunkInfo.name) || commonEntryFiles[chunkInfo.name] || clientEntryFiles[chunkInfo.name]) {
                            return config.assetsDir + '/[name].js';
                        }
                        return config.assetsDir + '/[name]-[hash].js';
                    }
                }
            }
        }
    });
    if (!('output' in clientBuildOutput)) {
        throw new Error('Unexpected vite client build output');
    }
    for (const cssAsset of cssAssets){
        const from = (0, _path.joinPath)(rootDir, config.distDir, cssAsset);
        const to = (0, _path.joinPath)(rootDir, config.distDir, config.publicDir, cssAsset);
        await (0, _nodefs.rename)(from, to);
    }
    return clientBuildOutput;
};
const emitRscFiles = async (rootDir, config, distEntriesFile)=>{
    const distEntries = await Promise.resolve((0, _path.filePathToFileURL)(distEntriesFile)).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p)));
    const buildConfig = await (0, _rscrenderer.getBuildConfig)({
        config,
        entries: distEntries
    });
    const clientModuleMap = new Map();
    const addClientModule = (input, id)=>{
        let idSet = clientModuleMap.get(input);
        if (!idSet) {
            idSet = new Set();
            clientModuleMap.set(input, idSet);
        }
        idSet.add(id);
    };
    const getClientModules = (input)=>{
        const idSet = clientModuleMap.get(input);
        return Array.from(idSet || []);
    };
    const rscFileSet = new Set(); // XXX could be implemented better
    await Promise.all(Object.entries(buildConfig).map(async ([, { entries, context }])=>{
        for (const [input] of entries || []){
            const destRscFile = (0, _path.joinPath)(rootDir, config.distDir, config.publicDir, config.rscPath, (0, _utils.encodeInput)(// Should we do this here? Or waku/router or in entries.ts?
            input.split('\\').join('/')));
            if (!rscFileSet.has(destRscFile)) {
                rscFileSet.add(destRscFile);
                await (0, _nodefs.mkdir)((0, _path.joinPath)(destRscFile, '..'), {
                    recursive: true
                });
                const readable = await (0, _rscrenderer.renderRsc)({
                    input,
                    method: 'GET',
                    config,
                    context,
                    moduleIdCallback: (id)=>addClientModule(input, id),
                    isDev: false,
                    entries: distEntries
                });
                await (0, _promises.pipeline)(_nodestream.Readable.fromWeb(readable), (0, _nodefs.createWriteStream)(destRscFile));
            }
        }
    }));
    return {
        buildConfig,
        getClientModules,
        rscFiles: Array.from(rscFileSet)
    };
};
const emitHtmlFiles = async (rootDir, config, distEntriesFile, buildConfig, getClientModules, ssr)=>{
    const distEntries = await Promise.resolve((0, _path.filePathToFileURL)(distEntriesFile)).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p)));
    const basePrefix = config.basePath + config.rscPath + '/';
    const publicIndexHtmlFile = (0, _path.joinPath)(rootDir, config.distDir, config.publicDir, config.indexHtml);
    const publicIndexHtml = await (0, _nodefs.readFile)(publicIndexHtmlFile, {
        encoding: 'utf8'
    });
    let loadHtmlCode = `
export function loadHtml(pathStr) {
  switch (pathStr) {
`;
    const htmlFiles = await Promise.all(Object.entries(buildConfig).map(async ([pathStr, { entries, customCode, context }])=>{
        const destHtmlFile = (0, _path.joinPath)(rootDir, config.distDir, config.publicDir, (0, _path.extname)(pathStr) ? pathStr : pathStr + '/' + config.indexHtml);
        const destHtmlJsFile = (0, _path.joinPath)(rootDir, config.distDir, config.htmlsDir, ((0, _path.extname)(pathStr) ? pathStr : pathStr + '/' + config.indexHtml) + '.js');
        loadHtmlCode += `    case ${JSON.stringify(pathStr)}:
      return import('./${(0, _path.joinPath)(config.htmlsDir, ((0, _path.extname)(pathStr) ? pathStr : pathStr + '/' + config.indexHtml) + '.js')}').then((m)=>m.default);
`;
        let htmlStr;
        if ((0, _nodefs.existsSync)(destHtmlFile)) {
            htmlStr = await (0, _nodefs.readFile)(destHtmlFile, {
                encoding: 'utf8'
            });
        } else {
            await (0, _nodefs.mkdir)((0, _path.joinPath)(destHtmlFile, '..'), {
                recursive: true
            });
            htmlStr = publicIndexHtml;
        }
        await (0, _nodefs.mkdir)((0, _path.joinPath)(destHtmlJsFile, '..'), {
            recursive: true
        });
        const inputsForPrefetch = new Set();
        const moduleIdsForPrefetch = new Set();
        for (const [input, skipPrefetch] of entries || []){
            if (!skipPrefetch) {
                inputsForPrefetch.add(input);
                for (const id of getClientModules(input)){
                    moduleIdsForPrefetch.add(id);
                }
            }
        }
        const code = (0, _utils.generatePrefetchCode)(basePrefix, inputsForPrefetch, moduleIdsForPrefetch) + (customCode || '');
        if (code) {
            // HACK is this too naive to inject script code?
            htmlStr = htmlStr.replace(/<\/head>/, `<script type="module" async>${code}</script></head>`);
        }
        const htmlResult = ssr && await (0, _htmlrenderer.renderHtml)({
            config,
            pathStr,
            htmlStr,
            context,
            isDev: false,
            entries: distEntries
        });
        if (htmlResult) {
            const [htmlReadable1, htmlReadable2] = htmlResult[0].tee();
            await Promise.all([
                (0, _promises.pipeline)(_nodestream.Readable.fromWeb(htmlReadable1), (0, _nodefs.createWriteStream)(destHtmlFile)),
                (0, _stream.streamToString)(htmlReadable2).then((str)=>(0, _nodefs.writeFile)(destHtmlJsFile, `export default ${JSON.stringify(str)};`))
            ]);
        } else {
            await Promise.all([
                (0, _nodefs.writeFile)(destHtmlFile, htmlStr),
                (0, _nodefs.writeFile)(destHtmlJsFile, `export default ${JSON.stringify(htmlStr)};`)
            ]);
        }
        return destHtmlFile;
    }));
    loadHtmlCode += `
    default:
      throw new Error('Cannot find HTML for ' + pathStr);
  }
}`;
    await (0, _nodefs.appendFile)(distEntriesFile, loadHtmlCode);
    return {
        htmlFiles
    };
};
const emitVercelOutput = async (rootDir, config, clientBuildOutput, rscFiles, htmlFiles, ssr)=>{
    // FIXME somehow utils/(path,node-fs).ts doesn't work
    const [path, { existsSync, mkdirSync, readdirSync, symlinkSync, writeFileSync }] = await Promise.all([
        Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:path"))),
        Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:fs")))
    ]);
    const clientFiles = clientBuildOutput.output.map(({ fileName })=>path.join(rootDir, config.distDir, config.publicDir, fileName));
    const srcDir = path.join(rootDir, config.distDir, config.publicDir);
    const dstDir = path.join(rootDir, config.distDir, '.vercel', 'output');
    for (const file of [
        ...clientFiles,
        ...rscFiles,
        ...htmlFiles
    ]){
        const dstFile = path.join(dstDir, 'static', path.relative(srcDir, file));
        if (!existsSync(dstFile)) {
            mkdirSync(path.dirname(dstFile), {
                recursive: true
            });
            symlinkSync(path.relative(path.dirname(dstFile), file), dstFile);
        }
    }
    // for serverless function
    const serverlessDir = path.join(dstDir, 'functions', config.rscPath + '.func');
    mkdirSync(path.join(serverlessDir, config.distDir), {
        recursive: true
    });
    mkdirSync(path.join(serverlessDir, 'node_modules'));
    symlinkSync(path.relative(path.join(serverlessDir, 'node_modules'), path.join(rootDir, 'node_modules', 'waku')), path.join(serverlessDir, 'node_modules', 'waku'));
    for (const file of readdirSync(path.join(rootDir, config.distDir))){
        if ([
            '.vercel'
        ].includes(file)) {
            continue;
        }
        symlinkSync(path.relative(path.join(serverlessDir, config.distDir), path.join(rootDir, config.distDir, file)), path.join(serverlessDir, config.distDir, file));
    }
    const vcConfigJson = {
        runtime: 'nodejs18.x',
        handler: 'serve.js',
        launcherType: 'Nodejs'
    };
    writeFileSync(path.join(serverlessDir, '.vc-config.json'), JSON.stringify(vcConfigJson, null, 2));
    writeFileSync(path.join(serverlessDir, 'package.json'), JSON.stringify({
        type: 'module'
    }, null, 2));
    writeFileSync(path.join(serverlessDir, 'serve.js'), `
import path from 'node:path';
import { connectMiddleware } from 'waku';
const entries = import(path.resolve('${config.distDir}', '${config.entriesJs}'));
export default async function handler(req, res) {
  connectMiddleware({ entries, ssr: true })(req, res, () => {
    throw new Error('not handled');
  });
}
`);
    const overrides = Object.fromEntries(rscFiles.filter((file)=>!path.extname(file)).map((file)=>[
            path.relative(srcDir, file),
            {
                contentType: 'text/plain'
            }
        ]));
    const basePrefix = config.basePath + config.rscPath + '/';
    const routes = [
        {
            src: basePrefix + '(.*)',
            dest: basePrefix
        },
        ...ssr ? htmlFiles.map((htmlFile)=>{
            const file = config.basePath + path.relative(srcDir, htmlFile);
            const src = file.endsWith('/' + config.indexHtml) ? file.slice(0, -('/' + config.indexHtml).length) || '/' : file;
            return {
                src,
                dest: basePrefix
            };
        }) : []
    ];
    const configJson = {
        version: 3,
        overrides,
        routes
    };
    mkdirSync(dstDir, {
        recursive: true
    });
    writeFileSync(path.join(dstDir, 'config.json'), JSON.stringify(configJson, null, 2));
};
const resolveFileName = (fname)=>{
    for (const ext of [
        '.js',
        '.ts',
        '.tsx',
        '.jsx'
    ]){
        const resolvedName = fname.slice(0, -(0, _path.extname)(fname).length) + ext;
        if ((0, _nodefs.existsSync)(resolvedName)) {
            return resolvedName;
        }
    }
    return fname; // returning the default one
};
async function build(options) {
    const config = await (0, _config.resolveConfig)(options.config || {});
    const rootDir = (await (0, _vite.resolveConfig)({}, 'build', 'production', 'production')).root;
    const entriesFile = resolveFileName((0, _path.joinPath)(rootDir, config.srcDir, config.entriesJs));
    const distEntriesFile = resolveFileName((0, _path.joinPath)(rootDir, config.distDir, config.entriesJs));
    const { commonEntryFiles, clientEntryFiles, serverEntryFiles } = await analyzeEntries(entriesFile);
    const serverBuildOutput = await buildServerBundle(rootDir, config, entriesFile, distEntriesFile, commonEntryFiles, clientEntryFiles, serverEntryFiles);
    const clientBuildOutput = await buildClientBundle(rootDir, config, commonEntryFiles, clientEntryFiles, serverBuildOutput);
    const { buildConfig, getClientModules, rscFiles } = await emitRscFiles(rootDir, config, distEntriesFile);
    const { htmlFiles } = await emitHtmlFiles(rootDir, config, distEntriesFile, buildConfig, getClientModules, !!options?.ssr);
    // https://vercel.com/docs/build-output-api/v3
    await emitVercelOutput(rootDir, config, clientBuildOutput, rscFiles, htmlFiles, !!options?.ssr);
}
