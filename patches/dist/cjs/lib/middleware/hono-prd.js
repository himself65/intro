"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "honoMiddleware", {
    enumerable: true,
    get: function() {
        return honoMiddleware;
    }
});
const _honoutils = require("./hono-utils.js");
const _handlerprd = require("../rsc/handler-prd.js");
function honoMiddleware(...args) {
    return (0, _honoutils.honoWrapper)((0, _handlerprd.createHandler)(...args));
}
