import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { HelmetServerState } from "react-helmet-async";
import App from "./App";

// Re-exported so `scripts/prerender.mjs` can fetch exactly the sections the public site reads,
// without duplicating the list in a second place where it could drift.
export { PUBLIC_SECTIONS } from "@/domains/cms/constants";

interface RenderResult {
  html: string;
  head: string;
}

import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";

export function render(url: string): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    const hook = () => [url, () => {}] as [string, (path: string, ...args: any[]) => any];
    const helmetContext: { helmet?: HelmetServerState } = {};

    let html = "";
    const writable = new Writable({
      write(chunk: any, _encoding: any, callback: () => void) {
        html += chunk.toString();
        callback();
      },
    });

    const { pipe } = renderToPipeableStream(
      <Router hook={hook}>
        <App isServer={true} helmetContext={helmetContext} />
      </Router>,
      {
        onAllReady() {
          pipe(writable);
          writable.on("finish", () => {
            const { helmet } = helmetContext;
            let head = "";
            if (helmet) {
              head = `
                ${helmet.title.toString()}
                ${helmet.meta.toString()}
                ${helmet.link.toString()}
                ${helmet.script.toString()}
              `;
            }
            resolve({ html, head });
          });
        },
        onError(error) {
          console.error("SSR Rendering Error:", error);
          reject(error);
        },
      }
    );
  });
}
