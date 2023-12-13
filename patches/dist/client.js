/// <reference types="react/canary" />
'use client';
import { cache, createContext, createElement, memo, use, useCallback, useState, startTransition } from 'react';
import RSDWClient from 'react-server-dom-webpack/client';
import { encodeInput } from './lib/rsc/utils.js';
const { createFromFetch, encodeReply } = RSDWClient;
const checkStatus = async (responsePromise)=>{
    const response = await responsePromise;
    if (!response.ok) {
        const err = new Error(response.statusText);
        err.statusCode = response.status;
        throw err;
    }
    return response;
};
const mergeElements = cache(async (a, b)=>{
    const nextElements = {
        ...await a,
        ...await b
    };
    delete nextElements._value;
    return nextElements;
});
// TODO get basePath from config
export const fetchRSC = cache((input, rerender, basePath = '/RSC/')=>{
    const options = {
        async callServer (actionId, args) {
            const response = fetch(basePath + encodeInput(encodeURIComponent(actionId)), {
                method: 'POST',
                body: await encodeReply(args)
            });
            const data = createFromFetch(checkStatus(response), options);
            startTransition(()=>{
                // FIXME this causes rerenders even if data is empty
                rerender((prev)=>mergeElements(prev, data));
            });
            return (await data)._value;
        }
    };
    const prefetched = globalThis.__WAKU_PREFETCHED__ ||= {};
    const response = prefetched[input] || fetch(basePath + encodeInput(input));
    delete prefetched[input];
    const data = createFromFetch(checkStatus(response), options);
    return data;
});
const RefetchContext = createContext(()=>{
    throw new Error('Missing Root component');
});
const ElementsContext = createContext(null);
// HACK there should be a better way...
const createRerender = cache(()=>{
    let rerender;
    const stableRerender = (fn)=>{
        rerender?.(fn);
    };
    const getRerender = ()=>stableRerender;
    const setRerender = (newRerender)=>{
        rerender = newRerender;
    };
    return [
        getRerender,
        setRerender
    ];
});
export const Root = ({ initialInput, children, basePath })=>{
    const [getRerender, setRerender] = createRerender();
    const [elements, setElements] = useState(()=>fetchRSC(initialInput || '', getRerender(), basePath));
    setRerender(setElements);
    const refetch = useCallback((input)=>{
        const data = fetchRSC(input, getRerender(), basePath);
        setElements((prev)=>mergeElements(prev, data));
    }, [
        getRerender,
        basePath
    ]);
    return createElement(RefetchContext.Provider, {
        value: refetch
    }, createElement(ElementsContext.Provider, {
        value: elements
    }, children));
};
export const useRefetch = ()=>use(RefetchContext);
const ChildrenContext = createContext(undefined);
const ChildrenContextProvider = memo(ChildrenContext.Provider);
export const Slot = ({ id, children })=>{
    const elementsPromise = use(ElementsContext);
    if (!elementsPromise) {
        throw new Error('Missing Root component');
    }
    const elements = use(elementsPromise);
    if (!(id in elements)) {
        throw new Error('Not found: ' + id);
    }
    return createElement(ChildrenContextProvider, {
        value: children
    }, elements[id]);
};
export const Children = ()=>use(ChildrenContext);
export const ServerRoot = ({ elements, children })=>createElement(ElementsContext.Provider, {
        value: elements
    }, children);
