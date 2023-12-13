"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveConfig", {
    enumerable: true,
    get: function() {
        return resolveConfig;
    }
});
const splitHTML = (htmlStr)=>{
    const P1 = [
        '<!--placeholder1-->\\s*<div[^>]*>',
        '</div>\\s*<!--/placeholder1-->'
    ];
    const P2 = [
        '<!--placeholder2-->',
        '<!--/placeholder2-->'
    ];
    const anyRE = '[\\s\\S]*';
    const match = htmlStr.match(new RegExp(// prettier-ignore
    "^(" + anyRE + P1[0] + ")" + anyRE + "(" + P1[1] + anyRE + P2[0] + ")" + anyRE + "(" + P2[1] + anyRE + ")$"));
    if (match?.length !== 1 + 3) {
        throw new Error('Failed to split HTML');
    }
    return match.slice(1);
};
async function resolveConfig(config) {
    const resolvedConfig = {
        basePath: '/',
        srcDir: 'src',
        distDir: 'dist',
        publicDir: 'public',
        assetsDir: 'assets',
        htmlsDir: 'htmls',
        indexHtml: 'index.html',
        entriesJs: 'entries.js',
        rscPath: 'RSC',
        ...config,
        ssr: {
            splitHTML,
            ...config?.ssr
        }
    };
    return resolvedConfig;
}
