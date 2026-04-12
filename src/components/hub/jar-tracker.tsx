'use client'

interface JarTrackerProps {
  spend: number
  save: number
  give: number
  savingsGoal?: number   // optional — shown as progress bar on save jar
}

interface JarProps {
  emoji: string
  label: string
  amount: number
  colour: string
  bgColour: string
  goal?: number
}

function Jar({ emoji, label, amount, colour, bgColour, goal }: JarProps) {
  const progress = goal ? Math.min((amount / goal) * 100, 100) : null

  return (
    <div
      className="flex-1 rounded-[20px] p-4 text-center"
      style={{ background: bgColour }}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <div
        className="text-xs font-black uppercase tracking-wider mb-1"
        style={{ color: colour }}
      >
        {label}
      </div>
      <div
        className="font-nunito font-black text-xl"
        style={{ color: colour }}
      >
        ${amount.toFixed(2)}
      </div>

      {/* Savings progress bar */}
      {goal && progress !== null && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: colour }}
            />
          </div>
          <div className="text-[10px] mt-1" style={{ color: colour }}>
            ${goal.toFixed(2)} goal · {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  )
}

export function JarTracker({ spend, save, give, savingsGoal }: JarTrackerProps) {
  return (
    <div className="flex gap-2">
      <Jar
        emoji="🛍️"
        label="Spend"
        amount={spend}
        colour="#ff8070"
        bgColour="rgba(255,100,80,0.10)"
      />
      <Jar
        emoji="🐷"
        label="Save"
        amount={save}
        colour="#4ade80"
        bgColour="rgba(34,197,94,0.10)"
        goal={savingsGoal}
      />
      <Jar
        emoji="💙"
        label="Give"
        amount={give}
        colour="#93c5fd"
        bgColour="rgba(100,150,255,0.10)"
      />
    </div>
  )
}
