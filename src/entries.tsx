import { lazy } from 'react'
import { defineEntries } from 'waku/server'

const App = lazy(() => import('./components/App.js'))

export default defineEntries(
  // renderEntries
  async () => {
    return {
      App: <App/>
    }
  },
  // getBuildConfig
  async () => {
    return {
      '/': {
        entries: [['']]
      }
    }
  },
  // getSsrConfig
  async (pathStr) => {
    const url = new URL(pathStr, 'http://localhost')
    switch (url.pathname) {
      case '/':
        return {
          input: '',
          unstable_render: ({ createElement, Slot }) =>
            createElement(Slot, { id: 'App' })
        }
      default:
        return null
    }
  }
)
