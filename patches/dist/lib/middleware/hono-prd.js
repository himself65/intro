import { honoWrapper } from './hono-utils.js';
import { createHandler } from '../rsc/handler-prd.js';
export function honoMiddleware(...args) {
    return honoWrapper(createHandler(...args));
}
