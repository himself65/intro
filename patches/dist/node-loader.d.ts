/// <reference types="node" resolution-mode="require"/>
/**
 * We manually call the hooks on react-server-dom-webpack/node-loader.
 * 1. `react-server-dom-webpack/node-loader` uses Node.js 18 deprecated API.
 * 2. `conditions` will not be read in ESM,
 *      which will lead to a React warning on Node.js 20.
 *      Refs: https://github.com/nodejs/node/issues/50885
 */
import type { LoadHook, ResolveHook } from 'node:module';
export declare const load: LoadHook;
export declare const resolve: ResolveHook;
