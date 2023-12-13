// Terminology:
// - filePath: posix-like file path, e.g. `/foo/bar.js` or `c:/foo/bar.js`
//   This is used by Vite.
// - fileURL: file URL, e.g. `file:///foo/bar.js` or `file:///c:/foo/bar.js`
//   This is used by import().
// - osPath: os dependent path, e.g. `/foo/bar.js` or `c:\foo\bar.js`
//   This is used by node:fs.
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
    decodeFilePathFromAbsolute: function() {
        return decodeFilePathFromAbsolute;
    },
    encodeFilePathToAbsolute: function() {
        return encodeFilePathToAbsolute;
    },
    extname: function() {
        return extname;
    },
    filePathToFileURL: function() {
        return filePathToFileURL;
    },
    fileURLToFilePath: function() {
        return fileURLToFilePath;
    },
    joinPath: function() {
        return joinPath;
    }
});
const ABSOLUTE_WIN32_PATH_REGEXP = /^\/[a-zA-Z]:\//;
const encodeFilePathToAbsolute = (filePath)=>{
    if (ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)) {
        throw new Error('Unsupported absolute file path');
    }
    if (filePath.startsWith('/')) {
        return filePath;
    }
    return '/' + filePath;
};
const decodeFilePathFromAbsolute = (filePath)=>{
    if (ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)) {
        return filePath.slice(1);
    }
    return filePath;
};
const filePathToFileURL = (filePath)=>'file://' + encodeURI(filePath);
const fileURLToFilePath = (fileURL)=>{
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    return decodeURI(fileURL.slice('file://'.length));
};
const joinPath = (...paths)=>{
    const isAbsolute = paths[0]?.startsWith('/');
    const items = [].concat(...paths.map((path)=>path.split('/')));
    let i = 0;
    while(i < items.length){
        if (items[i] === '.' || items[i] === '') {
            items.splice(i, 1);
        } else if (items[i] === '..') {
            if (i > 0) {
                items.splice(i - 1, 2);
                --i;
            } else {
                items.splice(i, 1);
            }
        } else {
            ++i;
        }
    }
    return (isAbsolute ? '/' : '') + items.join('/') || '.';
};
const extname = (filePath)=>{
    const index = filePath.lastIndexOf('.');
    return index > 0 ? filePath.slice(index) : '';
};
