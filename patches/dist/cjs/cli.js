#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _nodeurl = /*#__PURE__*/ _interop_require_default(require("node:url"));
const _nodeutil = require("node:util");
const _nodemodule = require("node:module");
const _hono = require("hono");
const _nodeserver = require("@hono/node-server");
const _servestatic = require("@hono/node-server/serve-static");
const _config = require("./lib/config.js");
const _honodev = require("./lib/middleware/hono-dev.js");
const _honoprd = require("./lib/middleware/hono-prd.js");
const _builder = require("./lib/builder.js");
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
const require1 = (0, _nodemodule.createRequire)(new URL('.', require("url").pathToFileURL(__filename).toString()));
const { values, positionals } = (0, _nodeutil.parseArgs)({
    args: process.argv.splice(2),
    allowPositionals: true,
    options: {
        'with-ssr': {
            type: 'boolean'
        },
        version: {
            type: 'boolean',
            short: 'v'
        },
        help: {
            type: 'boolean',
            short: 'h'
        }
    }
});
const cmd = positionals[0];
if (values.version) {
    const { version } = require1('../package.json');
    console.log(version);
} else if (values.help) {
    displayUsage();
} else {
    switch(cmd){
        case 'dev':
            runDev({
                ssr: !!values['with-ssr']
            });
            break;
        case 'build':
            runBuild({
                ssr: !!values['with-ssr']
            });
            break;
        case 'start':
            runStart({
                ssr: !!values['with-ssr']
            });
            break;
        default:
            if (cmd) {
                console.error('Unknown command:', cmd);
            }
            displayUsage();
            break;
    }
}
async function runDev(options) {
    const app = new _hono.Hono();
    app.use('*', (0, _honodev.honoMiddleware)({
        ssr: options.ssr
    }));
    const port = parseInt(process.env.PORT || '3000', 10);
    startServer(app, port);
}
async function runBuild(options) {
    await (0, _builder.build)({
        ssr: options.ssr
    });
}
async function runStart(options) {
    const { distDir, publicDir, entriesJs } = await (0, _config.resolveConfig)({});
    const entries = Promise.resolve(_nodeurl.default.pathToFileURL(_nodepath.default.resolve(distDir, entriesJs)).toString()).then((p)=>/*#__PURE__*/ _interop_require_wildcard(require(p)));
    const app = new _hono.Hono();
    app.use('*', (0, _honoprd.honoMiddleware)({
        entries,
        ssr: options.ssr
    }));
    app.use('*', (0, _servestatic.serveStatic)({
        root: _nodepath.default.join(distDir, publicDir)
    }));
    const port = parseInt(process.env.PORT || '8080', 10);
    startServer(app, port);
}
async function startServer(app, port) {
    const server = (0, _nodeserver.serve)({
        ...app,
        port
    }, ()=>{
        console.log(`ready: Listening on http://localhost:${port}/`);
    });
    server.on('error', (err)=>{
        if (err.code === 'EADDRINUSE') {
            console.log(`warn: Port ${port} is in use, trying ${port + 1} instead.`);
            startServer(app, port + 1);
        } else {
            console.error('Failed to start server');
        }
    });
}
function displayUsage() {
    console.log(`
Usage: waku [options] <command>

Commands:
  dev         Start the development server
  build       Build the application for production
  start       Start the production server

Options:
  -c, --config <path>   Path to the configuration file
  --with-ssr            Use opt-in SSR
  -v, --version         Display the version number
  -h, --help            Display this help message
`);
}
