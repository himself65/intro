import { codeToInject } from '../rsc/utils.js';
export function rscIndexPlugin(cssAssets) {
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
                    children: codeToInject,
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
