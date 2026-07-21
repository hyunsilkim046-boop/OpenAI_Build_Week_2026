interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark${compact ? " brand-mark--compact" : ""}`} aria-label="WhyRight">
      <span className="brand-mark__why">Why</span>
      <span className="brand-mark__right">Right</span>
      <span className="brand-mark__scribble" aria-hidden="true" />
    </div>
  );
}
