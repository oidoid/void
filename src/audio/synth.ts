export class Synth {
  #context?: AudioContext

  beep(
    type: OscillatorType,
    startHz: number,
    endHz: number,
    duration: number, // why can't this be short?
  ): void {
    this.#context ??= new AudioContext()
    const now = this.#context.currentTime
    const end = now + duration

    const oscillator = this.#context.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(startHz, now)
    oscillator.frequency.exponentialRampToValueAtTime(endHz, end)

    const gain = this.#context.createGain()
    gain.gain.setValueAtTime(1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, end)

    oscillator.connect(gain)
    gain.connect(this.#context.destination)

    oscillator.start()
    oscillator.stop(end)
  }
}
