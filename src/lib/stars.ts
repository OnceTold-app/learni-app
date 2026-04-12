// ─────────────────────────────────────────────────────
// EARNI STAR SYSTEM
//
// Rules:
// - 4 stars per correct answer
// - Accuracy bonus: ≥80% = +10 stars, ≥60% = +5 stars
// - Streak bonus: 2 stars per streak day (capped at 5 days)
// - Weekly cap enforced by the caller, not this function
// ─────────────────────────────────────────────────────

export function calculateStarsEarned(
  questionsCorrect: number,
  questionsTotal: number,
  streakDays: number
): number {
  if (questionsTotal === 0) return 0

  const baseStars = questionsCorrect * 4

  const accuracy = questionsCorrect / questionsTotal
  const accuracyBonus = accuracy >= 0.8 ? 10 : accuracy >= 0.6 ? 5 : 0

  // Streak bonus: 2 stars/day, capped at day 5
  const streakBonus = Math.min(streakDays, 5) * 2

  return baseStars + accuracyBonus + streakBonus
}

// Convert stars to dollar amount using the family's rate
// Rate is stored in reward_settings.stars_per_dollar
export function starsToDollars(
  stars: number,
  starsPerDollar: number
): number {
  return parseFloat((stars / starsPerDollar).toFixed(2))
}

// Allocate a dollar amount across the three jars
// Percentages come from jar_allocations table
export function allocateToJars(
  totalDollars: number,
  spendPct: number,
  savePct: number,
  givePct: number
): { spend: number; save: number; give: number } {
  return {
    spend: parseFloat(((totalDollars * spendPct) / 100).toFixed(2)),
    save:  parseFloat(((totalDollars * savePct)  / 100).toFixed(2)),
    give:  parseFloat(((totalDollars * givePct)  / 100).toFixed(2)),
  }
}

// Calculate what a learner is currently owed
// Sums the star_ledger: earned rows minus paid_out rows
export function calculateStarsOwed(
  ledgerEntries: Array<{ stars: number; type: string }>
): number {
  return ledgerEntries.reduce((total, entry) => {
    return total + entry.stars // earned = positive, paid_out = negative
  }, 0)
}
