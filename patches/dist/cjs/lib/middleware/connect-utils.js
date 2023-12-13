"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "connectWrapper", {
    enumerable: true,
    get: function() {
        return connectWrapper;
    }
});
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
const connectWrapper = (m)=>{
    return async (connectReq, connectRes, next)=>{
        const { Readable, Writable } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("node:stream"))).catch((e)=>{
            // XXX explicit catch to avoid bundle time error
            throw e;
        });
        const req = {
            stream: Readable.toWeb(connectReq),
            method: connectReq.method || '',
            url: new URL(connectReq.url || '', `http://${connectReq.headers.host}`).toString(),
            contentType: connectReq.headers['content-type'],
            orig: connectReq
        };
        const res = {
            stream: Writable.toWeb(connectRes),
            setStatus: (code)=>connectRes.statusCode = code,
            setHeader: (name, value)=>connectRes.setHeader(name, value),
            orig: connectRes
        };
        m(req, res, next).catch(console.log);
    };
};
