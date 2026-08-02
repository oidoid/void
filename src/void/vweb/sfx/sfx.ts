export type SFX = {ctx: AudioContext; gain: GainNode}

export function SFX(): SFX {
  const ctx = new AudioContext()
  const gain = ctx.createGain()
  gain.gain.value = 2 // to-do: expose global and group gains.
  gain.connect(ctx.destination)
  return {ctx, gain}
}

export function beep(
  sfx: Readonly<SFX>,
  startHz: number,
  endHz: number,
  millis: number,
  delayMillis: number
): void {
  const start = sfx.ctx.currentTime + delayMillis / 1000
  const end = start + millis / 1000
  const oscillator = sfx.ctx.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(startHz, start)
  oscillator.frequency.exponentialRampToValueAtTime(endHz, end)

  const gain = sfx.ctx.createGain()
  // init to 0 to prevent the default gain=1 burst before the scheduled ramp
  // fires. critical to avoid clicking.
  gain.gain.setValueAtTime(0, sfx.ctx.currentTime)
  const attack = (0.1 * millis) / 1000 // critical to avoid clicking.
  gain.gain.linearRampToValueAtTime(0.3, start + attack)
  gain.gain.linearRampToValueAtTime(0, end)

  oscillator.connect(gain)
  gain.connect(sfx.gain)
  oscillator.start(start)
  oscillator.stop(end)
}
