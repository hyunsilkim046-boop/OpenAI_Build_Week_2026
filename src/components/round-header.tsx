import { BrandMark } from "@/components/brand-mark";

interface RoundHeaderProps {
  secondsLeft: number;
  remainingTurns: number;
  subject: string;
  grade: string;
  onExit: () => void;
}

export function RoundHeader({ secondsLeft, remainingTurns, subject, grade, onExit }: RoundHeaderProps) {
  const elapsedTurns = 3 - remainingTurns;
  const timeUrgent = secondsLeft <= 20;

  return (
    <header className="round-header">
      <button type="button" className="round-header__exit" onClick={onExit} aria-label="Exit this round">
        <span aria-hidden="true">←</span>
        <BrandMark compact />
      </button>

      <div className="round-header__case">
        <span>{subject}</span>
        <span aria-hidden="true">/</span>
        <span>{grade}</span>
      </div>

      <div className="round-meters">
        <div
          className={`timer${timeUrgent ? " timer--urgent" : ""}`}
          role="timer"
          aria-live="off"
          aria-label={`${secondsLeft} seconds left`}
        >
          <span className="timer__icon" aria-hidden="true" />
          <strong>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</strong>
        </div>
        <div className="probe-meter" aria-label={`${elapsedTurns} of 3 probes used`}>
          <span>Probes</span>
          <div>
            {[0, 1, 2].map((probe) => (
              <i key={probe} className={probe < elapsedTurns ? "is-used" : ""} aria-hidden="true" />
            ))}
          </div>
          <strong>{elapsedTurns}/3</strong>
        </div>
      </div>
    </header>
  );
}
