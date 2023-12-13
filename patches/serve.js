import path from 'node:path'
import { connectMiddleware } from 'waku'

const entries = import(path.resolve('dist', 'entries.js'))
export default async function handler (req, res) {
  connectMiddleware({ entries, ssr: true })(req, res, () => {
    console.log('not handled', JSON.stringify(req))
    throw new Error('not handled')
  })
}
