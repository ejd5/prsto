// Dégradé de score unifié PRSTO — 4 zones égales de 25%
// Rouge 0→25% (foncé→clair) • Orange 25→50% (foncé→clair)
// Jaune 50→75% (foncé→clair) • Vert 75→100% (clair→foncé)

const STOPS = [
  { at: 0, r: 140, g: 10, b: 10 },
  { at: 10, r: 185, g: 45, b: 40 },
  { at: 20, r: 215, g: 85, b: 55 },
  { at: 30, r: 225, g: 135, b: 40 },
  { at: 40, r: 235, g: 175, b: 45 },
  { at: 50, r: 225, g: 205, b: 35 },
  { at: 60, r: 210, g: 220, b: 60 },
  { at: 70, r: 175, g: 225, b: 80 },
  { at: 80, r: 100, g: 220, b: 95 },
  { at: 90, r: 50, g: 200, b: 85 },
  { at: 100, r: 15, g: 155, b: 60 },
];

export function getScoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].at && clamped <= STOPS[i + 1].at) { lo = STOPS[i]; hi = STOPS[i + 1]; break; }
  }
  const t = (hi.at === lo.at) ? 0 : (clamped - lo.at) / (hi.at - lo.at);
  return `rgb(${Math.round(lo.r + (hi.r - lo.r) * t)},${Math.round(lo.g + (hi.g - lo.g) * t)},${Math.round(lo.b + (hi.b - lo.b) * t)})`;
}

export function getScoreBg(score: number, alpha = 0.12): string {
  const clamped = Math.max(0, Math.min(100, score));
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].at && clamped <= STOPS[i + 1].at) { lo = STOPS[i]; hi = STOPS[i + 1]; break; }
  }
  const t = (hi.at === lo.at) ? 0 : (clamped - lo.at) / (hi.at - lo.at);
  return `rgba(${Math.round(lo.r + (hi.r - lo.r) * t)},${Math.round(lo.g + (hi.g - lo.g) * t)},${Math.round(lo.b + (hi.b - lo.b) * t)},${alpha})`;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  const c = getScoreColor(score);
  if (score >= 95) return { label: "Match parfait", color: c };
  if (score >= 85) return { label: "Excellent", color: c };
  if (score >= 75) return { label: "Très bon match", color: c };
  if (score >= 65) return { label: "Bon match", color: c };
  if (score >= 55) return { label: "Match moyen", color: c };
  if (score >= 45) return { label: "Limite", color: c };
  if (score >= 35) return { label: "Insuffisant", color: c };
  if (score >= 25) return { label: "Faible", color: c };
  if (score >= 15) return { label: "Très faible", color: c };
  return { label: "Incompatible", color: c };
}
