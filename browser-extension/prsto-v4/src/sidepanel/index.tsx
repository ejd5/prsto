/**
 * PRSTO Copilot — Side Panel React Entry
 */

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import CopilotChat from "./components/CopilotChat";
import { JobOffer, ChatMessage } from "../lib/types";

function App() {
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "prsto:getOffer" }, (maybeOffer: JobOffer | null) => {
      if (maybeOffer?.title) setOffer(maybeOffer);

      chrome.runtime.onMessage.addListener((msg: any) => {
        if (msg?.type === "prsto:scoreReady" && msg.data?.offer) {
          setOffer((prev: JobOffer | null) => prev || msg.data.offer);
        }
        return false;
      });

      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ivory)" }}>
        <div className="thinking"><div className="thinking-dots"><span/><span/><span/></div> PRSTO Copilot</div>
      </div>
    );
  }

  return <CopilotChat initialOffer={offer} />;
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
