'use client';
import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, useTransition, Fragment } from 'react';
import { Root, Slot, useRefetch } from '../client.js';
import { getComponentIds, getInputString } from './common.js';
const parseLocation = ()=>{
    const { pathname, search } = window.location;
    return {
        pathname,
        search
    };
};
const RouterContext = createContext(null);
export function useChangeLocation() {
    const value = useContext(RouterContext);
    if (!value) {
        return ()=>{
            throw new Error('Missing Router');
        };
    }
    return value.changeLocation;
}
export function useLocation() {
    const value = useContext(RouterContext);
    if (!value) {
        throw new Error('Missing Router');
    }
    return value.loc;
}
export function Link({ href, children, pending, notPending, unstable_prefetchOnEnter }) {
    const value = useContext(RouterContext);
    const changeLocation = value ? value.changeLocation : ()=>{
        throw new Error('Missing Router');
    };
    const prefetchLocation = value ? value.prefetchLocation : ()=>{
        throw new Error('Missing Router');
    };
    const [isPending, startTransition] = useTransition();
    const onClick = (event)=>{
        event.preventDefault();
        const url = new URL(href, window.location.href);
        if (url.href !== window.location.href) {
            prefetchLocation(url.pathname, url.search);
            startTransition(()=>{
                changeLocation(url.pathname, url.search);
            });
        }
    };
    const onMouseEnter = unstable_prefetchOnEnter ? ()=>{
        const url = new URL(href, window.location.href);
        if (url.href !== window.location.href) {
            prefetchLocation(url.pathname, url.search);
        }
    } : undefined;
    const ele = createElement('a', {
        href,
        onClick,
        onMouseEnter
    }, children);
    if (isPending && pending !== undefined) {
        return createElement(Fragment, null, ele, pending);
    }
    if (!isPending && notPending !== undefined) {
        return createElement(Fragment, null, ele, notPending);
    }
    return ele;
}
const getSkipList = (componentIds, props, cached, shouldSkip)=>shouldSkip ? componentIds.filter((id)=>{
        const prevProps = cached[id];
        return prevProps && shouldSkip(id, props, prevProps);
    }) : [];
function InnerRouter({ basePath, shouldSkip }) {
    const refetch = useRefetch();
    const [loc, setLoc] = useState(parseLocation);
    const componentIds = getComponentIds(loc.pathname);
    const [cached, setCached] = useState(()=>{
        const routeProps = {
            path: loc.pathname,
            search: loc.search
        };
        return Object.fromEntries(componentIds.map((id)=>[
                id,
                routeProps
            ]));
    });
    const cachedRef = useRef(cached);
    useEffect(()=>{
        cachedRef.current = cached;
    }, [
        cached
    ]);
    const changeLocation = useCallback((pathname, search, mode = 'push')=>{
        const url = new URL(window.location.href);
        if (pathname) {
            url.pathname = pathname;
        }
        if (search) {
            url.search = search;
        }
        if (mode === 'replace') {
            window.history.replaceState(window.history.state, '', url);
        } else if (mode === 'push') {
            window.history.pushState(window.history.state, '', url);
        }
        const loc = parseLocation();
        setLoc(loc);
        const componentIds = getComponentIds(loc.pathname);
        const routeProps = {
            path: loc.pathname,
            search: loc.search
        };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current, shouldSkip);
        if (skip.length === componentIds.length) {
            return; // everything is cached
        }
        const input = getInputString(loc.pathname, loc.search, skip);
        refetch(input);
        setCached((prev)=>({
                ...prev,
                ...Object.fromEntries(componentIds.flatMap((id)=>skip.includes(id) ? [] : [
                        [
                            id,
                            routeProps
                        ]
                    ]))
            }));
    }, [
        refetch,
        shouldSkip
    ]);
    const prefetchLocation = useCallback((pathname, search)=>{
        const componentIds = getComponentIds(pathname);
        const routeProps = {
            path: pathname,
            search: search
        };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current, shouldSkip);
        if (skip.length === componentIds.length) {
            return; // everything is cached
        }
        const input = getInputString(pathname, search, skip);
        const prefetched = globalThis.__WAKU_PREFETCHED__ ||= {};
        if (!prefetched[input]) {
            prefetched[input] = fetch(basePath + input);
        }
        globalThis.__WAKU_ROUTER_PREFETCH__?.(pathname, search);
    }, [
        basePath,
        shouldSkip
    ]);
    useEffect(()=>{
        const callback = ()=>{
            const loc = parseLocation();
            prefetchLocation(loc.pathname, loc.search);
            changeLocation(loc.pathname, loc.search, false);
        };
        window.addEventListener('popstate', callback);
        return ()=>window.removeEventListener('popstate', callback);
    }, [
        changeLocation,
        prefetchLocation
    ]);
    const children = componentIds.reduceRight((acc, id)=>createElement(Slot, {
            id
        }, acc), null);
    return createElement(RouterContext.Provider, {
        value: {
            loc,
            changeLocation,
            prefetchLocation
        }
    }, children);
}
export function Router({ basePath = '/RSC/', shouldSkip }) {
    const { pathname, search } = parseLocation();
    const initialInput = getInputString(pathname, search);
    return createElement(Root, {
        initialInput,
        basePath
    }, createElement(InnerRouter, {
        basePath,
        shouldSkip
    }));
}
