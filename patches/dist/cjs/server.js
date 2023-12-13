"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defineEntries", {
    enumerable: true,
    get: function() {
        return defineEntries;
    }
});
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return {
        renderEntries,
        getBuildConfig,
        getSsrConfig
    };
}
