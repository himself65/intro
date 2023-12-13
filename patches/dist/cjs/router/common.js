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
    getComponentIds: function() {
        return getComponentIds;
    },
    getInputString: function() {
        return getInputString;
    },
    parseInputString: function() {
        return parseInputString;
    }
});
function getComponentIds(pathname) {
    const pathItems = pathname.split('/').filter(Boolean);
    const idSet = new Set();
    for(let index = 0; index <= pathItems.length; ++index){
        const id = [
            ...pathItems.slice(0, index),
            'layout'
        ].join('/');
        idSet.add(id);
    }
    idSet.add([
        ...pathItems,
        'page'
    ].join('/'));
    return Array.from(idSet);
}
function getInputString(pathname, search, skip) {
    if (search.includes('/')) {
        throw new Error('Invalid search');
    }
    let input = search ? '=' + pathname.replace(/\/$/, '/__INDEX__') + '/' + search : '-' + pathname.replace(/\/$/, '/__INDEX__');
    if (skip) {
        const params = new URLSearchParams();
        skip.forEach((id)=>params.append('skip', id));
        input += '?' + params;
    }
    return input;
}
function parseInputString(input) {
    const [first, second] = input.split('?', 2);
    const skip = second && new URLSearchParams(second).getAll('skip');
    if (first?.startsWith('=')) {
        const index = first.lastIndexOf('/');
        return {
            pathname: first.slice(1, index).replace(/\/__INDEX__$/, '/'),
            search: first.slice(index + 1),
            ...skip ? {
                skip
            } : {}
        };
    } else if (first?.startsWith('-')) {
        return {
            pathname: first.slice(1).replace(/\/__INDEX__$/, '/'),
            search: '',
            ...skip ? {
                skip
            } : {}
        };
    } else {
        throw new Error('Invalid input string');
    }
}