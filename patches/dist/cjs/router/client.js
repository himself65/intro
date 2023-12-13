'use client';
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
    Link: function() {
        return Link;
    },
    Router: function() {
        return Router;
    },
    useChangeLocation: function() {
        return useChangeLocation;
    },
    useLocation: function() {
        return useLocation;
    }
});
const _react = require("react");
const _client = require("../client.js");
const _common = require("./common.js");
const parseLocation = ()=>{
    const { pathname, search } = window.location;
    return {
        pathname,
        search
    };
};
const RouterContext = (0, _react.createContext)(null);
function useChangeLocation() {
    const value = (0, _react.useContext)(RouterContext);
    if (!value) {
        return ()=>{
            throw new Error('Missing Router');
        };
    }
    return value.changeLocation;
}
function useLocation() {
    const value = (0, _react.useContext)(RouterContext);
    if (!value) {
        throw new Error('Missing Router');
    }
    return value.loc;
}
function Link({ href, children, pending, notPending, unstable_prefetchOnEnter }) {
    const value = (0, _react.useContext)(RouterContext);
    const changeLocation = value ? value.changeLocation : ()=>{
        throw new Error('Missing Router');
    };
    const prefetchLocation = value ? value.prefetchLocation : ()=>{
        throw new Error('Missing Router');
    };
    const [isPending, startTransition] = (0, _react.useTransition)();
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
    const ele = (0, _react.createElement)('a', {
        href,
        onClick,
        onMouseEnter
    }, children);
    if (isPending && pending !== undefined) {
        return (0, _react.createElement)(_react.Fragment, null, ele, pending);
    }
    if (!isPending && notPending !== undefined) {
        return (0, _react.createElement)(_react.Fragment, null, ele, notPending);
    }
    return ele;
}
const getSkipList = (componentIds, props, cached, shouldSkip)=>shouldSkip ? componentIds.filter((id)=>{
        const prevProps = cached[id];
        return prevProps && shouldSkip(id, props, prevProps);
    }) : [];
function InnerRouter({ basePath, shouldSkip }) {
    const refetch = (0, _client.useRefetch)();
    const [loc, setLoc] = (0, _react.useState)(parseLocation);
    const componentIds = (0, _common.getComponentIds)(loc.pathname);
    const [cached, setCached] = (0, _react.useState)(()=>{
        const routeProps = {
            path: loc.pathname,
            search: loc.search
        };
        return Object.fromEntries(componentIds.map((id)=>[
                id,
                routeProps
            ]));
    });
    const cachedRef = (0, _react.useRef)(cached);
    (0, _react.useEffect)(()=>{
        cachedRef.current = cached;
    }, [
        cached
    ]);
    const changeLocation = (0, _react.useCallback)((pathname, search, mode = 'push')=>{
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
        const componentIds = (0, _common.getComponentIds)(loc.pathname);
        const routeProps = {
            path: loc.pathname,
            search: loc.search
        };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current, shouldSkip);
        if (skip.length === componentIds.length) {
            return; // everything is cached
        }
        const input = (0, _common.getInputString)(loc.pathname, loc.search, skip);
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
    const prefetchLocation = (0, _react.useCallback)((pathname, search)=>{
        const componentIds = (0, _common.getComponentIds)(pathname);
        const routeProps = {
            path: pathname,
            search: search
        };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current, shouldSkip);
        if (skip.length === componentIds.length) {
            return; // everything is cached
        }
        const input = (0, _common.getInputString)(pathname, search, skip);
        const prefetched = globalThis.__WAKU_PREFETCHED__ ||= {};
        if (!prefetched[input]) {
            prefetched[input] = fetch(basePath + input);
        }
        globalThis.__WAKU_ROUTER_PREFETCH__?.(pathname, search);
    }, [
        basePath,
        shouldSkip
    ]);
    (0, _react.useEffect)(()=>{
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
    const children = componentIds.reduceRight((acc, id)=>(0, _react.createElement)(_client.Slot, {
            id
        }, acc), null);
    return (0, _react.createElement)(RouterContext.Provider, {
        value: {
            loc,
            changeLocation,
            prefetchLocation
        }
    }, children);
}
function Router({ basePath = '/RSC/', shouldSkip }) {
    const { pathname, search } = parseLocation();
    const initialInput = (0, _common.getInputString)(pathname, search);
    return (0, _react.createElement)(_client.Root, {
        initialInput,
        basePath
    }, (0, _react.createElement)(InnerRouter, {
        basePath,
        shouldSkip
    }));
}
