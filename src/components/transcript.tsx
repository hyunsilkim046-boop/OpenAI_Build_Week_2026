"use client";

import { useEffect, useRef } from "react";
import type { TranscriptItem } from "@/components/whyright-types";

interface TranscriptProps {
  items: TranscriptItem[];
  waiting: boolean;
}

export function Transcript({ items, waiting }: TranscriptProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript || !nearBottomRef.current) return;
    transcript.scrollTo({ top: transcript.scrollHeight, behavior: "auto" });
  }, [items.length, waiting]);

  function trackScrollPosition() {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    const distanceFromBottom =
      transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    nearBottomRef.current = distanceFromBottom <= 96;
  }

  return (
    <div
      ref={transcriptRef}
      className="transcript"
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
      onScroll={trackScrollPosition}
    >
      {items.map((item, index) => (
        <article key={item.id} className={`message message--${item.role}`}>
          <div className="message__avatar" aria-hidden="true">
            {item.role === "student" ? "S" : "Y"}
          </div>
          <div className="message__content">
            <div className="message__meta">
              <strong>{item.role === "student" ? "Synthetic learner" : "You"}</strong>
              <span>{item.role === "student" && index === 0 ? "Opening answer" : item.role === "student" ? "Response" : "Probe"}</span>
            </div>
            <p>{item.text}</p>
          </div>
        </article>
      ))}

      {waiting ? (
        <article className="message message--student" aria-label="Synthetic learner is thinking">
          <div className="message__avatar" aria-hidden="true">S</div>
          <div className="message__content message__content--typing">
            <div className="typing-dots" aria-hidden="true"><i /><i /><i /></div>
            <span>Reasoning from the same hidden belief…</span>
          </div>
        </article>
      ) : null}
    </div>
  );
}
