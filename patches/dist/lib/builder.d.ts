import type { Config } from './config.js';
export declare function build(options: {
    config?: Config;
    ssr?: boolean;
}): Promise<void>;
