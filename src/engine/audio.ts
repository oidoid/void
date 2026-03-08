import type {Millis} from './types/time.ts'

export type Audio = {context: AudioContext; gain: GainNode}

export function Audio(): Audio {
  const context = new AudioContext()
  const gain = context.createGain()
  gain.gain.value = 0.8
  gain.connect(context.destination)
  return {context, gain}
}

export function beep(
  audio: Readonly<Audio>,
  type: OscillatorType,
  startHz: number,
  endHz: number,
  duration: Millis,
  delayMillis: Millis,
  queue: 'Drop' | 'Queue' = 'Drop'
): void {
  if (queue !== 'Queue' && audio.context.state !== 'running') return
  const start = audio.context.currentTime + delayMillis / 1000
  const end = start + duration / 1000

  const oscillator = audio.context.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(startHz, start)
  oscillator.frequency.exponentialRampToValueAtTime(endHz, end)

  const gain = audio.context.createGain()
  // initialize to 0 immediately to prevent the default gain=1 burst before the
  // scheduled ramp fires. critical to avoid clicking.
  gain.gain.setValueAtTime(0, audio.context.currentTime)
  const attack = (0.1 * duration) / 1000 // critical to avoid clicking.
  gain.gain.linearRampToValueAtTime(0.3, start + attack)
  gain.gain.linearRampToValueAtTime(0, end)

  oscillator.connect(gain)
  gain.connect(audio.gain)

  oscillator.start(start)
  oscillator.stop(end)
}
