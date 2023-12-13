/// <reference types="node" resolution-mode="require"/>
import fs from 'node:fs';
export declare const createReadStream: (filePath: string) => fs.ReadStream;
export declare const createWriteStream: (filePath: string) => fs.WriteStream;
export declare const existsSync: (filePath: string) => boolean;
export declare const rename: (filePath1: string, filePath2: string) => Promise<void>;
export declare const mkdir: (filePath: string, options?: {
    recursive?: boolean | undefined;
}) => Promise<string | undefined>;
export declare const readFile: (filePath: string, options: {
    encoding: 'utf8';
}) => Promise<string>;
export declare const writeFile: (filePath: string, content: string) => Promise<void>;
export declare const appendFile: (filePath: string, content: string) => Promise<void>;
export declare const stat: (filePath: string) => Promise<fs.Stats>;
