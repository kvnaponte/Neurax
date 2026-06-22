import React from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useOverlayStore } from '@/store/overlayStore'
import { LevelUpOverlay } from '@/components/animations/LevelUpOverlay'
import { XPRise } from '@/components/animations/XPRise'

export function GlobalOverlays() {
  useWebSocket()

  const { levelUp, hideLevelUp, xpRises, removeXPRise } = useOverlayStore()

  return (
    <>
      {xpRises.map((rise) => (
        <XPRise
          key={rise.id}
          xp={rise.xp}
          onComplete={() => removeXPRise(rise.id)}
        />
      ))}
      {levelUp && (
        <LevelUpOverlay
          nivel={levelUp.nivel}
          nombreNivel={levelUp.nombreNivel}
          colorNivel={levelUp.colorNivel}
          onClose={hideLevelUp}
        />
      )}
    </>
  )
}
