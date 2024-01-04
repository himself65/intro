import { defineRouter } from 'waku/router/server'

export default defineRouter(
  // getComponent
  async (id) => {
    console.log('id', id)
    switch (id) {
      case 'articles/hello-world/layout':
      case 'layout': {
        return import('./routes/layout.js')
      }
      case 'page': {
        return import('./routes/page.js')
      }
      case 'articles/hello-world/page': {
        return import('./routes/articles/hello-world/page.js')
      }
      default: {
        return null
      }
    }
  },
  // getRoutePaths
  async () => {
    return ['/', '/articles/hello-world']
  }
)
