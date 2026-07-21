import { BrandMark } from "@/components/brand-mark";
import type { ScenarioSummary } from "@/components/whyright-types";

interface StartScreenProps {
  scenarios: ScenarioSummary[];
  selectedScenarioId: string;
  loading: boolean;
  starting: boolean;
  scenarioError: string;
  startError: string;
  onSelectScenario: (scenarioId: string) => void;
  onStart: () => void;
  onRetryScenarios: () => void;
  onRetryStart: () => void;
}

export function StartScreen({
  scenarios,
  selectedScenarioId,
  loading,
  starting,
  scenarioError,
  startError,
  onSelectScenario,
  onStart,
  onRetryScenarios,
  onRetryStart,
}: StartScreenProps) {
  return (
    <main className="landing-shell">
      <header className="landing-nav content-width">
        <BrandMark compact />
        <div className="landing-nav__label">
          <span className="status-dot" aria-hidden="true" />
          90-second diagnostic lab
        </div>
      </header>

      <section className="hero content-width" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow"><span aria-hidden="true">✦</span> For teachers who ask one question deeper</p>
          <h1 id="hero-title">
            The answer is right.
            <span>The reason is not.</span>
          </h1>
          <p className="hero__lede">
            Diagnose a synthetic learner&apos;s hidden misconception before the clock runs out.
            Three probes. One fixed answer key. No AI vibes-based scoring.
          </p>
          <div className="hero__badges" aria-label="Round format">
            <span><strong>90</strong> sec</span>
            <span><strong>3</strong> probes</span>
            <span><strong>1</strong> fixed answer key</span>
          </div>
          <a className="hero__case-link" href="#choose-case">
            Choose a case <span aria-hidden="true">↓</span>
          </a>
        </div>

        <aside className="hero-note" aria-label="How it works">
          <span className="hero-note__tape" aria-hidden="true" />
          <p className="hero-note__kicker">Your mission</p>
          <p className="hero-note__quote">“Don&apos;t ask for the answer. Ask for the model behind it.”</p>
          <ol>
            <li><span>01</span> Read the correct answer</li>
            <li><span>02</span> Probe the reasoning</li>
            <li><span>03</span> Name the misconception</li>
          </ol>
        </aside>
      </section>

      <section id="choose-case" className="scenario-section content-width" aria-labelledby="scenario-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose your case file</p>
            <h2 id="scenario-title">Which reasoning will you investigate?</h2>
          </div>
          <p>Each learner stays faithful to one hidden belief for the whole round.</p>
        </div>

        {scenarioError ? (
          <div className="inline-alert" role="alert">
            <div>
              <strong>We couldn&apos;t open the case files.</strong>
              <p>{scenarioError}</p>
            </div>
            <button type="button" className="text-button" onClick={onRetryScenarios}>Try loading again</button>
          </div>
        ) : null}

        {loading ? (
          <div className="scenario-grid" aria-label="Loading scenarios" aria-busy="true">
            <div className="scenario-skeleton" />
            <div className="scenario-skeleton" />
          </div>
        ) : (
          <fieldset className="scenario-fieldset">
            <legend className="sr-only">Select one scenario</legend>
            <div className="scenario-grid">
              {scenarios.map((scenario, index) => {
                const selected = selectedScenarioId === scenario.id;
                return (
                  <label
                    key={scenario.id}
                    className={`scenario-card scenario-card--${scenario.accent}${selected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      value={scenario.id}
                      checked={selected}
                      onChange={() => onSelectScenario(scenario.id)}
                    />
                    <span className="scenario-card__number" aria-hidden="true">0{index + 1}</span>
                    <span className="scenario-card__meta">
                      <span>{scenario.subject}</span>
                      <span>{scenario.grade}</span>
                    </span>
                    <strong>{scenario.title}</strong>
                    <span className="scenario-card__challenge">{scenario.challenge}</span>
                    <span className="scenario-card__answer">
                      <span>Student&apos;s opening</span>
                      “{scenario.openingAnswer}”
                    </span>
                    <span className="scenario-card__select">
                      <span className="radio-glyph" aria-hidden="true" />
                      {selected ? "Selected" : "Select case"}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="start-row">
          <div className="honesty-strip" aria-label="Data and model details">
            <span><i aria-hidden="true">G</i> GPT-5.6 live simulation</span>
            <span><i aria-hidden="true">S</i> Synthetic learner</span>
            <span><i aria-hidden="true">O</i> Probe text sent to OpenAI</span>
            <span><i aria-hidden="true">!</i> Do not enter real student information</span>
          </div>
          <div className="start-action">
            <button
              type="button"
              className="primary-button primary-button--large"
              disabled={!selectedScenarioId || loading || starting}
              onClick={onStart}
            >
              {starting ? <span className="button-spinner" aria-hidden="true" /> : null}
              {starting ? "Opening case…" : "Start round"}
              {!starting ? <span aria-hidden="true">→</span> : null}
            </button>
            {startError ? (
              <div className="start-error" role="alert">
                <strong>We couldn&apos;t start this round.</strong>
                <p>{startError}</p>
                <button type="button" className="text-button" onClick={onRetryStart} disabled={starting}>
                  Try starting again
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <p className="start-status" role="status" aria-live="polite">
          {starting ? "Creating a new synthetic learner session." : ""}
        </p>
      </section>

      <footer className="landing-footer content-width">
        <span>WhyRight / Education prototype</span>
        <span>Question the reasoning, not the learner.</span>
      </footer>
    </main>
  );
}
