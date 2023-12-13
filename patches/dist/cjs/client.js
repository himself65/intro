/// <reference types="react/canary" />
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
    Children: function() {
        return Children;
    },
    Root: function() {
        return Root;
    },
    ServerRoot: function() {
        return ServerRoot;
    },
    Slot: function() {
        return Slot;
    },
    fetchRSC: function() {
        return fetchRSC;
    },
    useRefetch: function() {
        return useRefetch;
    }
});
const _react = require("react");
const _client = /*#__PURE__*/ _interop_require_default(require("react-server-dom-webpack/client"));
const _utils = require("./lib/rsc/utils.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const { createFromFetch, encodeReply } = _client.default;
const checkStatus = async (responsePromise)=>{
    const response = await responsePromise;
    if (!response.ok) {
        const err = new Error(response.statusText);
        err.statusCode = response.status;
        throw err;
    }
    return response;
};
const mergeElements = (0, _react.cache)(async (a, b)=>{
    const nextElements = {
        ...await a,
        ...await b
    };
    delete nextElements._value;
    return nextElements;
});
const fetchRSC = (0, _react.cache)((input, rerender, basePath = '/RSC/')=>{
    const options = {
        async callServer (actionId, args) {
            const response = fetch(basePath + (0, _utils.encodeInput)(encodeURIComponent(actionId)), {
                method: 'POST',
                body: await encodeReply(args)
            });
            const data = createFromFetch(checkStatus(response), options);
            (0, _react.startTransition)(()=>{
                // FIXME this causes rerenders even if data is empty
                rerender((prev)=>mergeElements(prev, data));
            });
            return (await data)._value;
        }
    };
    const prefetched = globalThis.__WAKU_PREFETCHED__ ||= {};
    const response = prefetched[input] || fetch(basePath + (0, _utils.encodeInput)(input));
    delete prefetched[input];
    const data = createFromFetch(checkStatus(response), options);
    return data;
});
const RefetchContext = (0, _react.createContext)(()=>{
    throw new Error('Missing Root component');
});
const ElementsContext = (0, _react.createContext)(null);
// HACK there should be a better way...
const createRerender = (0, _react.cache)(()=>{
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
const Root = ({ initialInput, children, basePath })=>{
    const [getRerender, setRerender] = createRerender();
    const [elements, setElements] = (0, _react.useState)(()=>fetchRSC(initialInput || '', getRerender(), basePath));
    setRerender(setElements);
    const refetch = (0, _react.useCallback)((input)=>{
        const data = fetchRSC(input, getRerender(), basePath);
        setElements((prev)=>mergeElements(prev, data));
    }, [
        getRerender,
        basePath
    ]);
    return (0, _react.createElement)(RefetchContext.Provider, {
        value: refetch
    }, (0, _react.createElement)(ElementsContext.Provider, {
        value: elements
    }, children));
};
const useRefetch = ()=>(0, _react.use)(RefetchContext);
const ChildrenContext = (0, _react.createContext)(undefined);
const ChildrenContextProvider = (0, _react.memo)(ChildrenContext.Provider);
const Slot = ({ id, children })=>{
    const elementsPromise = (0, _react.use)(ElementsContext);
    if (!elementsPromise) {
        throw new Error('Missing Root component');
    }
    const elements = (0, _react.use)(elementsPromise);
    if (!(id in elements)) {
        throw new Error('Not found: ' + id);
    }
    return (0, _react.createElement)(ChildrenContextProvider, {
        value: children
    }, elements[id]);
};
const Children = ()=>(0, _react.use)(ChildrenContext);
const ServerRoot = ({ elements, children })=>(0, _react.createElement)(ElementsContext.Provider, {
        value: elements
    }, children);
