/**
 * PlaybackGate - releases the NEXT delivery only when every visual part of the current one has finished.
 *
 * A delivery arms the gate with the ball-return ("retrieval"). Batter movement (running between the
 * wickets, walk-off / walk-in) adds a second hold. onRelease fires exactly once, when the last hold is
 * done - whichever finishes last. cancel()/reset() never release (skip and replay handle that themselves).
 */
export type GateHold = 'retrieval' | 'transition';

export class PlaybackGate {
  private pending = new Set<GateHold>();
  private armed = false;

  constructor(private readonly onRelease: () => void) {}

  /** Start of an animated delivery: the ball return is now outstanding. */
  arm(): void {
    this.pending = new Set<GateHold>(['retrieval']);
    this.armed = true;
  }

  /** Add a hold (e.g. batters running). Ignored if no delivery is armed. */
  hold(h: GateHold): void {
    if (this.armed) this.pending.add(h);
  }

  /** A hold has finished. Returns true if this released the gate. */
  done(h: GateHold): boolean {
    if (!this.armed) return false;
    this.pending.delete(h);
    if (this.pending.size > 0) return false;
    this.armed = false;
    this.onRelease();
    return true;
  }

  /** Drop a hold without releasing (cancelled movement). */
  drop(h: GateHold): void {
    this.pending.delete(h);
  }

  /** Release immediately (instant / skipped playback). Fires onRelease once. */
  release(): void {
    this.pending.clear();
    this.armed = false;
    this.onRelease();
  }

  /** Forget everything without releasing. */
  reset(): void {
    this.pending.clear();
    this.armed = false;
  }

  get isArmed(): boolean {
    return this.armed;
  }

  get holds(): GateHold[] {
    return [...this.pending];
  }
}
