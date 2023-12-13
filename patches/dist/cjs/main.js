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
    connectMiddleware: function() {
        return _connectprd.connectMiddleware;
    },
    honoMiddleware: function() {
        return _honoprd.honoMiddleware;
    },
    unstable_createHandler: function() {
        return _handlerprd.createHandler;
    }
});
const _honoprd = require("./lib/middleware/hono-prd.js");
const _connectprd = require("./lib/middleware/connect-prd.js");
const _handlerprd = require("./lib/rsc/handler-prd.js");
