export const connectWrapper = (m)=>{
    return async (connectReq, connectRes, next)=>{
        const { Readable, Writable } = await import('node:stream').catch((e)=>{
            // XXX explicit catch to avoid bundle time error
            throw e;
        });
        const req = {
            stream: Readable.toWeb(connectReq),
            method: connectReq.method || '',
            url: new URL(connectReq.url || '', `http://${connectReq.headers.host}`).toString(),
            contentType: connectReq.headers['content-type'],
            orig: connectReq
        };
        const res = {
            stream: Writable.toWeb(connectRes),
            setStatus: (code)=>connectRes.statusCode = code,
            setHeader: (name, value)=>connectRes.setHeader(name, value),
            orig: connectRes
        };
        m(req, res, next).catch(console.log);
    };
};
