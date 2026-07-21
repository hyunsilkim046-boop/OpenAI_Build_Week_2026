import type { MisconceptionCandidate } from "@/components/whyright-types";

interface CandidateBoardProps {
  candidates: MisconceptionCandidate[];
  plausibleCandidateIds: string[];
  committedCandidateIds: string[];
  disabled: boolean;
  onToggleCandidate: (candidateId: string) => void;
}

export function CandidateBoard({
  candidates,
  plausibleCandidateIds,
  committedCandidateIds,
  disabled,
  onToggleCandidate,
}: CandidateBoardProps) {
  return (
    <aside className="candidate-board" aria-labelledby="candidate-title">
      <div className="candidate-board__heading">
        <div>
          <p className="panel-kicker">Your working set</p>
          <h2 id="candidate-title">Still plausible?</h2>
        </div>
        <span>{plausibleCandidateIds.length}/{candidates.length}</span>
      </div>
      <p className="candidate-board__hint">
        Uncheck a belief only when the learner&apos;s words rule it out. Sending a probe
        commits this set, so anything already unchecked stays ruled out.
      </p>

      <fieldset disabled={disabled}>
        <legend className="sr-only">Plausible candidate mental models</legend>
        <div className="candidate-list">
          {candidates.map((candidate, index) => {
            const checked = plausibleCandidateIds.includes(candidate.id);
            const lockedOut = !checked && !committedCandidateIds.includes(candidate.id);
            const lastPlausible = checked && plausibleCandidateIds.length === 1;
            const stateDescription = lockedOut
              ? "Ruled out after the last probe. This candidate cannot be restored."
              : lastPlausible
                ? "Kept selected because at least one working hypothesis must remain."
                : "";
            const className = [
              "candidate-item",
              checked ? "is-plausible" : "",
              lockedOut ? "is-locked" : "",
              lastPlausible ? "is-last" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <label key={candidate.id} className={className}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={lockedOut || lastPlausible}
                  onChange={() => onToggleCandidate(candidate.id)}
                  aria-describedby={[
                    `candidate-${candidate.id}-description`,
                    stateDescription ? `candidate-${candidate.id}-state` : "",
                  ].filter(Boolean).join(" ")}
                />
                <span className="candidate-item__check" aria-hidden="true">{checked ? "✓" : ""}</span>
                <span className="candidate-item__copy">
                  <span className="candidate-item__index">H{index + 1}</span>
                  <strong>{candidate.label}</strong>
                  <span className="candidate-item__description" id={`candidate-${candidate.id}-description`}>
                    {candidate.shortDescription}
                  </span>
                  {stateDescription ? (
                    <span className="candidate-item__state" id={`candidate-${candidate.id}-state`}>
                      {stateDescription}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="candidate-board__rule">
        <span aria-hidden="true">!</span>
        <p>
          <strong>Fixed learner, committed set</strong>
          The learner&apos;s belief never changes. Once a probe is sent, ruled-out
          candidates stay out, and one working hypothesis must remain.
        </p>
      </div>
    </aside>
  );
}
