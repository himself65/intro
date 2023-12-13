import ReactExports from 'react';
import { Children } from '../client.js';
import { getComponentIds, getInputString, parseInputString } from './common.js';
// eslint-disable-next-line import/no-named-as-default-member
const { createElement } = ReactExports;
// We have to make prefetcher consistent with client behavior
const prefetcher = (pathname)=>{
    const search = ''; // XXX this is a limitation
    const input = getInputString(pathname, search);
    return [
        [
            input
        ]
    ];
};
const Default = ({ children })=>children;
export function defineRouter(getComponent, getPathsForBuild) {
    const renderEntries = async (input)=>{
        const { pathname, search, skip } = parseInputString(input);
        const componentIds = getComponentIds(pathname);
        const leafComponentId = componentIds[componentIds.length - 1];
        if (!leafComponentId || await getComponent(leafComponentId) === null) {
            return null;
        }
        const props = {
            path: pathname,
            search
        };
        const entries = (await Promise.all(componentIds.map(async (id)=>{
            if (skip?.includes(id)) {
                return [];
            }
            const mod = await getComponent(id);
            const component = typeof mod === 'function' ? mod : mod?.default || Default;
            const element = createElement(component, props, createElement(Children));
            return [
                [
                    id,
                    element
                ]
            ];
        }))).flat();
        return Object.fromEntries(entries);
    };
    const getBuildConfig = async (unstable_collectClientModules)=>{
        const pathnames = await getPathsForBuild();
        const path2moduleIds = {};
        for (const pathname of pathnames){
            const search = ''; // XXX this is a limitation
            const input = getInputString(pathname, search);
            const moduleIds = await unstable_collectClientModules(input);
            path2moduleIds[pathname] = moduleIds;
        }
        const customCode = `
globalThis.__WAKU_ROUTER_PREFETCH__ = (pathname, search) => {
  const path = search ? pathname + "?" + search : pathname;
  const path2ids = ${JSON.stringify(path2moduleIds)};
  for (const id of path2ids[path] || []) {
    import(id);
  }
};`;
        return Object.fromEntries(pathnames.map((pathname)=>[
                pathname,
                {
                    entries: prefetcher(pathname),
                    customCode
                }
            ]));
    };
    const getSsrConfig = async (pathStr)=>{
        const url = new URL(pathStr, 'http://localhost');
        const componentIds = getComponentIds(url.pathname);
        const leafComponentId = componentIds[componentIds.length - 1];
        if (!leafComponentId || await getComponent(leafComponentId) === null) {
            return null;
        }
        const input = getInputString(url.pathname, url.search);
        const render = ({ createElement, Slot })=>componentIds.reduceRight((acc, id)=>createElement(Slot, {
                    id
                }, acc), null);
        return {
            input,
            unstable_render: render
        };
    };
    return {
        renderEntries,
        getBuildConfig,
        getSsrConfig
    };
}
