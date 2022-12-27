export abstract class DeviceInput<T> {
  /**
   * How long the state has persisted. Duration is 0 (triggered) on state
   * change.
   */
  duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  abstract isOn(button: T): boolean;

  isOnStart(button: T): boolean {
    return this.isStart() && this.isOn(button);
  }

  isOnHeld(button: T): boolean {
    return this.isHeld() && this.isOn(button);
  }

  isOff(button: T): boolean {
    return !this.isOn(button);
  }

  isOffStart(button: T): boolean {
    return this.isOff(button) && this.isStart();
  }

  isOffHeld(button: T): boolean {
    return this.isOff(button) && this.isHeld();
  }

  postupdate(delta: number): void {
    this.duration += delta;
  }

  /** True if triggered. */
  protected isStart(): boolean {
    return this.duration == 0;
  }

  protected isHeld(): boolean {
    return this.duration > 400;
  }
}
