"use client";

import { useEffect, useRef } from "react";
import { BrandMark } from "@/components/brand-mark";
import type { DiagnosisResult, ScenarioSummary } from "@/components/whyright-types";

interface ResultsScreenProps {
  result: DiagnosisResult;
  scenario: ScenarioSummary;
  onTryAnother: () => void;
}

export function ResultsScreen({ result, scenario, onTryAnother }: ResultsScreenProps) {
  const resultsTitleRef = useRef<HTMLHeadingElement>(null);
  const breakdown = [
    { label: "Final diagnosis", value: result.breakdown.diagnosis, max: 70 },
    { label: "Correct hypothesis retained", value: result.breakdown.candidateDiscipline, max: 10 },
    { label: "Candidate reduction", value: result.breakdown.candidateReduction, max: 20 },
  ];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => resultsTitleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="results-shell">
      <header className="results-nav content-width">
        <BrandMark compact />
        <span>Round complete</span>
      </header>

      <section className="results-hero content-width" aria-labelledby="results-title">
        <div className={`score-card${result.isCorrect ? " score-card--correct" : ""}`}>
          <div className="score-card__ring" aria-label={`${result.score} out of ${result.total} points`}>
            <strong>{result.score}</strong>
            <span>/ {result.total}</span>
          </div>
          <div className="score-card__copy">
            <p className="eyebrow">Diagnostic score</p>
            <h1 id="results-title" ref={resultsTitleRef} tabIndex={-1}>
              {result.isCorrect ? "You found the why." : "Not yet—the evidence points elsewhere."}
            </h1>
            <p>{scenario.title}</p>
          </div>
          <span className="score-stamp" aria-hidden="true">{result.isCorrect ? "FOUND" : "REVIEW"}</span>
        </div>

        <div className="fixed-score-note">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Scored by fixed rules, not AI judgment</strong>
            <p>The diagnosis key and every point value were locked before your round began.</p>
          </div>
        </div>
      </section>

      <section className="results-grid content-width">
        <article className="result-panel breakdown-panel">
          <p className="panel-kicker">How the score was built</p>
          <h2>Deterministic breakdown</h2>
          <div className="breakdown-list">
            {breakdown.map((item) => (
              <div key={item.label} className="breakdown-item">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}<small>/{item.max}</small></strong>
                </div>
                <div className="breakdown-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(100, (item.value / item.max) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="result-panel answer-panel">
          <span className="answer-panel__label">Fixed answer reveal</span>
          <p className="panel-kicker">The hidden belief was</p>
          <h2>{result.correctDiagnosisLabel}</h2>
          <p>{result.reveal}</p>
        </article>

        <article className="result-panel clues-panel">
          <p className="panel-kicker">Evidence that mattered</p>
          <h2>Case design clues</h2>
          <ol>
            {result.clues.map((clue, index) => (
              <li key={`${index}-${clue}`}><span>0{index + 1}</span><p>{clue}</p></li>
            ))}
          </ol>
        </article>

        <article className="result-panel coaching-panel">
          <div className="coaching-block coaching-block--question">
            <span>Stronger hinge question</span>
            <p>“{result.strongerQuestion}”</p>
          </div>
          <div className="coaching-block coaching-block--transfer">
            <span>Try a transfer prompt</span>
            <p>{result.transferPrompt}</p>
          </div>
        </article>
      </section>

      <section className="results-action content-width">
        <div>
          <p className="eyebrow">One round down</p>
          <h2>Can you diagnose the other case?</h2>
        </div>
        <button type="button" className="primary-button primary-button--large" onClick={onTryAnother}>
          Try another round <span aria-hidden="true">→</span>
        </button>
      </section>

      <footer className="landing-footer content-width">
        <span>WhyRight / Education prototype</span>
        <span>Synthetic cases only · Do not enter real student information</span>
      </footer>
    </main>
  );
}
