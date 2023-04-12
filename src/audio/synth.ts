export class Synth {
  readonly #context: AudioContext = new AudioContext()
  oscillator?: OscillatorNode
  gain?: GainNode

  play(
    type: OscillatorType,
    startFrequency: number,
    endFrequency: number,
    duration: number,
  ): void {
    const oscillator = this.#context.createOscillator()
    const gain = this.#context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(
      startFrequency,
      this.#context.currentTime,
    )
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      this.#context.currentTime + duration,
    )

    gain.gain.setValueAtTime(1, this.#context.currentTime)
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.#context.currentTime + duration,
    )

    oscillator.connect(gain)
    gain.connect(this.#context.destination)

    oscillator.start()
    oscillator.stop(this.#context.currentTime + duration)
    this.oscillator = oscillator
    this.gain = gain
  }
}
