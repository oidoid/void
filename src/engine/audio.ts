import type {Millis} from './types/time.ts'

export type Audio = {context: AudioContext; gain: GainNode}

export function Audio(): Audio {
  const context = new AudioContext()
  const gain = context.createGain()
  gain.gain.value = 0.5
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
  const end = start + duration

  const oscillator = audio.context.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(startHz, start)
  oscillator.frequency.exponentialRampToValueAtTime(endHz, end)

  const gain = audio.context.createGain()
  gain.gain.setValueAtTime(0.2, start)
  gain.gain.exponentialRampToValueAtTime(0.01, end)

  oscillator.connect(gain)
  gain.connect(audio.gain)

  oscillator.start(start)
  oscillator.stop(end)
}
