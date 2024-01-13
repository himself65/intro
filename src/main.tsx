import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Root, Slot } from 'waku/client'

const rootElement = (
  <StrictMode>
    <Root>
      <Slot id="App"/>
    </Root>
  </StrictMode>
)

if ((globalThis as any).__WAKU_SSR_ENABLED__) {
  hydrateRoot(document.body, rootElement, {
    onRecoverableError (incomingError) {
      if (typeof incomingError === 'object' &&
        incomingError !== null &&
        'recoverableError' in incomingError &&
        incomingError.recoverableError === 'NO_SSR'
      ) {
        return
      }
    }
  })
} else {
  createRoot(document.body).render(rootElement)
}
