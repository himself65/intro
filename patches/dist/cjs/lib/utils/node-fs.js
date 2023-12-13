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
    appendFile: function() {
        return appendFile;
    },
    createReadStream: function() {
        return createReadStream;
    },
    createWriteStream: function() {
        return createWriteStream;
    },
    existsSync: function() {
        return existsSync;
    },
    mkdir: function() {
        return mkdir;
    },
    readFile: function() {
        return readFile;
    },
    rename: function() {
        return rename;
    },
    stat: function() {
        return stat;
    },
    writeFile: function() {
        return writeFile;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _promises = /*#__PURE__*/ _interop_require_default(require("node:fs/promises"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const filePathToOsPath = (filePath)=>_nodepath.default.sep === '/' ? filePath : filePath.replace(/\//g, '\\');
const createReadStream = (filePath)=>_nodefs.default.createReadStream(filePathToOsPath(filePath));
const createWriteStream = (filePath)=>_nodefs.default.createWriteStream(filePathToOsPath(filePath));
const existsSync = (filePath)=>_nodefs.default.existsSync(filePathToOsPath(filePath));
const rename = (filePath1, filePath2)=>_promises.default.rename(filePathToOsPath(filePath1), filePathToOsPath(filePath2));
const mkdir = (filePath, options)=>_promises.default.mkdir(filePathToOsPath(filePath), options);
const readFile = (filePath, options)=>_promises.default.readFile(filePathToOsPath(filePath), options);
const writeFile = (filePath, content)=>_promises.default.writeFile(filePathToOsPath(filePath), content);
const appendFile = (filePath, content)=>_promises.default.appendFile(filePathToOsPath(filePath), content);
const stat = (filePath)=>_promises.default.stat(filePathToOsPath(filePath));
