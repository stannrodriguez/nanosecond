import { useEffect } from 'react'
import { C } from '../theme'
import { Bar } from './Bar'
import { Panel } from './kit'
import { useFrameStepper } from './useFrameStepper'
import type { PuzzleFrame } from '../content/puzzles'

/**
 * The scripted-frame player: given a list of {cap, bars} frames, steps through
 * them on an interval once `running` flips true, then fires onEnd. The failure
 * (or the "it held") reveal that Find the Flaw and the Daily Incident both play.
 * Rendering the caption + utilization bars lives here so every mode that
 * dramatizes a scripted run reads from one component.
 */
export function FramePlayer({
  frames,
  running,
  intervalMs = 1700,
  onEnd,
  accent = C.compute,
}: {
  frames: PuzzleFrame[]
  running: boolean
  intervalMs?: number
  onEnd?: () => void
  accent?: string
}) {
  const stepper = useFrameStepper(frames.length, { intervalMs, onEnd })
  // Begin stepping when the caller starts the run; rewind when it stops.
  useEffect(() => {
    if (running) stepper.play()
    else stepper.reset()
    // stepper.play/reset are setState closures — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  const frame = frames[stepper.index]
  return (
    <Panel style={{ marginTop: 14 }}>
      <div className="mono" style={{ fontSize: 12.5, color: accent, minHeight: 36, lineHeight: 1.5, marginBottom: 12 }}>
        ▸ {frame.cap}
      </div>
      {frame.bars.map((b) => (
        <Bar key={b.label} label={b.label} u={b.u} ch={b.col} txt={b.txt} />
      ))}
    </Panel>
  )
}
