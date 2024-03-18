import { lazy } from "react";
import { Slot } from "waku/client";
import { defineEntries } from "waku/server";

const App = lazy(() => import("./components/App.js"));

export default defineEntries(
  // renderEntries
  async () => {
    return {
      App: <App />,
    };
  },
  // getBuildConfig
  async () => [{ pathname: "/", entries: [{ input: "" }] }],
  // getSsrConfig
  async (pathStr) => {
    const url = new URL(pathStr, "http://localhost");
    switch (url.pathname) {
      case "/":
        return {
          input: "",
          body: <Slot id="App" />,
        };
      default:
        return null;
    }
  },
);
