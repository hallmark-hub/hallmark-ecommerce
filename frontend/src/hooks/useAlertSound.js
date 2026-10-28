import { useEffect, useRef } from 'react'

const RING_MS = 8000

// Plays a short two-note chime every few seconds while `ringing` is true.
// Browsers keep audio locked until the page has had a click or keypress.
export default function useAlertSound(ringing) {
  const ctxRef = useRef(null)

  useEffect(() => {
    function unlock() { ctxRef.current?.resume() }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!ringing) return undefined

    function chime() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!ctxRef.current) ctxRef.current = new AudioCtx()
      const ctx = ctxRef.current
      if (ctx.state !== 'running') { ctx.resume().catch(() => {}); return }
      ;[660, 880].forEach((frequency, i) => {
        const start = ctx.currentTime + i * 0.2
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.3)
      })
    }

    chime()
    const timer = setInterval(chime, RING_MS)
    return () => clearInterval(timer)
  }, [ringing])
}
