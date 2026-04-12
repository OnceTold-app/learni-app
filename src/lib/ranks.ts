// Learni ranking system — earn titles by mastering topics and earning stars

export interface Rank {
  id: string
  title: string
  emoji: string
  starsRequired: number
  topicsMastered: number // topics with 80%+ accuracy
  color: string
}

export const RANKS: Rank[] = [
  { id: 'beginner', title: 'Starter', emoji: '🌱', starsRequired: 0, topicsMastered: 0, color: '#8abfba' },
  { id: 'explorer', title: 'Explorer', emoji: '🔍', starsRequired: 50, topicsMastered: 1, color: '#2ec4b6' },
  { id: 'learner', title: 'Learner', emoji: '📖', starsRequired: 150, topicsMastered: 2, color: '#3b82f6' },
  { id: 'scholar', title: 'Scholar', emoji: '🎓', starsRequired: 300, topicsMastered: 3, color: '#8b5cf6' },
  { id: 'champion', title: 'Champion', emoji: '🏅', starsRequired: 500, topicsMastered: 5, color: '#f59e0b' },
  { id: 'allstar', title: 'All-Star', emoji: '⭐', starsRequired: 800, topicsMastered: 7, color: '#ef4444' },
  { id: 'prodigy', title: 'Prodigy', emoji: '🚀', starsRequired: 1200, topicsMastered: 10, color: '#a855f7' },
  { id: 'legend', title: 'Legend', emoji: '👑', starsRequired: 2000, topicsMastered: 13, color: '#f5a623' },
  { id: 'grandmaster', title: 'Grand Master', emoji: '🌟', starsRequired: 3500, topicsMastered: 16, color: '#ff6b6b' },
]

export function getCurrentRank(totalStars: number, topicsMastered: number): Rank {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (totalStars >= rank.starsRequired && topicsMastered >= rank.topicsMastered) {
      current = rank
    } else {
      break
    }
  }
  return current
}

export function getNextRank(totalStars: number, topicsMastered: number): Rank | null {
  for (const rank of RANKS) {
    if (totalStars < rank.starsRequired || topicsMastered < rank.topicsMastered) {
      return rank
    }
  }
  return null
}

export function getProgressToNextRank(totalStars: number, topicsMastered: number): number {
  const current = getCurrentRank(totalStars, topicsMastered)
  const next = getNextRank(totalStars, topicsMastered)
  if (!next) return 100

  const currentIdx = RANKS.indexOf(current)
  const prevStars = RANKS[currentIdx]?.starsRequired || 0
  const starsProgress = (totalStars - prevStars) / (next.starsRequired - prevStars)
  const topicsProgress = topicsMastered / Math.max(next.topicsMastered, 1)
  return Math.min(Math.round(((starsProgress + topicsProgress) / 2) * 100), 99)
}
