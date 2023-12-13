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
    build: function() {
        return _builder.build;
    },
    connectMiddleware: function() {
        return _connectdev.connectMiddleware;
    },
    honoMiddleware: function() {
        return _honodev.honoMiddleware;
    },
    unstable_createHandler: function() {
        return _handlerdev.createHandler;
    }
});
const _honodev = require("./lib/middleware/hono-dev.js");
const _connectdev = require("./lib/middleware/connect-dev.js");
const _handlerdev = require("./lib/rsc/handler-dev.js");
const _builder = require("./lib/builder.js");
