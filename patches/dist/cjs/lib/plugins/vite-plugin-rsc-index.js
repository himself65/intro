"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "rscIndexPlugin", {
    enumerable: true,
    get: function() {
        return rscIndexPlugin;
    }
});
const _utils = require("../rsc/utils.js");
function rscIndexPlugin(cssAssets) {
    return {
        name: 'rsc-index-plugin',
        async transformIndexHtml () {
            return [
                {
                    tag: 'script',
                    attrs: {
                        type: 'module',
                        async: true
                    },
                    children: _utils.codeToInject,
                    injectTo: 'head-prepend'
                },
                ...cssAssets.map((href)=>({
                        tag: 'link',
                        attrs: {
                            rel: 'stylesheet',
                            href
                        },
                        injectTo: 'head'
                    }))
            ];
        }
    };
}
