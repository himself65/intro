"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "connectMiddleware", {
    enumerable: true,
    get: function() {
        return connectMiddleware;
    }
});
const _connectutils = require("./connect-utils.js");
const _handlerdev = require("../rsc/handler-dev.js");
function connectMiddleware(...args) {
    return (0, _connectutils.connectWrapper)((0, _handlerdev.createHandler)(...args));
}
