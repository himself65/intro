import path from 'node:path'
import { defineRouter } from 'waku/router/server'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

const pagesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'routes'
)

export default defineRouter(
  // getComponent
  async (id) => {
    const files = await glob(`${id}.tsx`, { cwd: pagesDir })
    if (files.length === 0) return null
    const items = id.split('/')
    switch (items.length) {
      case 1:
        return (await import(`./routes/${items[0]}.tsx`))
      case 2:
        return (await import(`./routes/${items[0]}/${items[1]}.tsx`))
      case 3:
        return (await import(`./routes/${items[0]}/${items[1]}/${items[2]}.tsx`))
      default:
        throw new Error('too many levels of nesting')
    }
  },
  // getRoutePaths
  async () => {
    const files = await glob('**/page.tsx', {
      cwd: pagesDir
    })
    return files.map(
      file => '/' + file.slice(0, Math.max(0, file.lastIndexOf('/')))
    )
  }
)
