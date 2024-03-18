import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Root, Slot } from "waku/client";

const rootElement = (
  <StrictMode>
    <Root>
      <Slot id="App" />
    </Root>
  </StrictMode>
);

if (document.body.dataset.hydrate) {
  hydrateRoot(document.body, rootElement, {
    onRecoverableError(incomingError) {
      if (
        typeof incomingError === "object" &&
        incomingError !== null &&
        "recoverableError" in incomingError &&
        incomingError.recoverableError === "NO_SSR"
      ) {
        return;
      }
    },
  });
} else {
  createRoot(document.body).render(rootElement);
}

const origConsoleError = window.console.error;
const isRecoverableError = (error: unknown): boolean => {
  return (
    !!error &&
    typeof error === "object" &&
    "recoverableError" in error &&
    !!error.recoverableError
  );
};

window.console.error = (...args) => {
  if (isRecoverableError(args[0])) {
    return;
  }
  origConsoleError.apply(window.console, args);
};
window.addEventListener("error", (ev) => {
  if (isRecoverableError(ev.error)) {
    ev.preventDefault();
    return;
  }
});
