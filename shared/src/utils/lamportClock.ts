class LamportClock {
  private counter: number = 0;

  constructor(initialValue: number = 0) {
    this.counter = initialValue;
  }

  public increment(): number {
    this.counter += 1;
    return this.counter;
  }

  public update(receivedTime: number): number {
    this.counter = Math.max(this.counter, receivedTime) + 1;
    return this.counter;
  }

  public getTime(): number {
    return this.counter;
  }

  public setTime(value: number): void {
    this.counter = value;
  }
}

export const lamportClock = new LamportClock();
