export declare const endStream: (stream: WritableStream, message?: string) => Promise<void>;
export declare const concatUint8Arrays: (arrs: Uint8Array[]) => Uint8Array;
export declare const streamToString: (stream: ReadableStream) => Promise<string>;
