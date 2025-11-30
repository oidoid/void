import type {AnyTag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {
  type CardinalDir,
  type CompassDir,
  type WH,
  whEq,
  type XY,
  xyEq
} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

export type NinePatchOpts<Tag extends AnyTag> = {
  margin?: Partial<WH>
  n: NinePatchDirOpts<Tag>
  origin: NinePatchDirOpts<Tag>
  border?: {[dir in Lowercase<CardinalDir>]?: number}
  wh?: Partial<WH>
  x?: number
  y?: number
  z?: Layer
} & {
  [dir in
    | 'w'
    | 'nw'
    | 'n'
    | 'ne'
    | 'e'
    | 'se'
    | 's'
    | 'sw']?: NinePatchDirOpts<Tag>
}
export type NinePatchDirOpts<Tag extends AnyTag> = {
  flip?: {x?: boolean; y?: boolean}
  tag: Tag
  stretch?: boolean
}

export class NinePatchEnt<Tag extends AnyTag> implements Ent<Tag> {
  readonly #dir: {readonly [dir in Lowercase<CompassDir>]: Sprite<Tag>}
  readonly #margin: Readonly<WH>
  #invalid: boolean = true

  constructor(v: Void<Tag, string>, opts: Readonly<NinePatchOpts<Tag>>) {
    this.#dir = {
      center: v.alloc(),
      w: v.alloc(),
      nw: v.alloc(),
      n: v.alloc(),
      ne: v.alloc(),
      e: v.alloc(),
      se: v.alloc(),
      s: v.alloc(),
      sw: v.alloc()
    }
    this.#dir.w.tag = opts.w?.tag ?? opts.e?.tag ?? opts.n.tag
    this.#dir.n.tag = opts.n.tag
    this.#dir.e.tag = opts.e?.tag ?? this.#dir.w.tag
    this.#dir.s.tag = opts.s?.tag ?? this.#dir.n.tag

    this.#dir.nw.tag = opts.nw?.tag ?? opts.se?.tag ?? opts.n.tag
    this.#dir.ne.tag =
      opts.ne?.tag ?? opts.sw?.tag ?? opts.nw?.tag ?? opts.n.tag
    this.#dir.se.tag = opts.se?.tag ?? this.#dir.nw.tag
    this.#dir.sw.tag = opts.sw?.tag ?? this.#dir.ne.tag

    this.#dir.center.tag = opts.origin.tag

    this.#dir.w.z =
      this.#dir.nw.z =
      this.#dir.n.z =
      this.#dir.ne.z =
      this.#dir.e.z =
      this.#dir.se.z =
      this.#dir.s.z =
      this.#dir.sw.z =
      this.#dir.center.z =
        opts.z ?? 0

    this.#dir.w.stretch = opts.w?.stretch ?? opts.e?.stretch ?? false
    this.#dir.n.stretch = opts.n.stretch ?? opts.s?.stretch ?? false
    this.#dir.e.stretch = opts.e?.stretch ?? this.#dir.w.stretch
    this.#dir.s.stretch = opts.s?.stretch ?? this.#dir.n.stretch

    this.#dir.nw.stretch = opts.nw?.stretch ?? opts.se?.stretch ?? false
    this.#dir.ne.stretch = opts.ne?.stretch ?? opts.sw?.stretch ?? false
    this.#dir.se.stretch = opts.se?.stretch ?? this.#dir.nw.stretch
    this.#dir.sw.stretch = opts.sw?.stretch ?? this.#dir.ne.stretch

    this.#dir.center.stretch = opts.origin.stretch ?? false

    this.#dir.w.flipX = opts.w?.flip?.x ?? !opts.e?.flip?.x
    this.#dir.w.flipY = opts.w?.flip?.y ?? !!opts.e?.flip?.y
    this.#dir.n.flipX = opts.n.flip?.x ?? !!opts.s?.flip?.x
    this.#dir.n.flipY = opts.n.flip?.y ?? !opts.s?.flip?.y
    this.#dir.e.flipX = opts.e?.flip?.x ?? !this.#dir.w.flipX
    this.#dir.e.flipY = opts.e?.flip?.y ?? this.#dir.w.flipY
    this.#dir.s.flipX = opts.s?.flip?.x ?? this.#dir.n.flipX
    this.#dir.s.flipY = opts.s?.flip?.y ?? !this.#dir.n.flipY
    this.#dir.center.flipX = !!opts.origin.flip?.x
    this.#dir.center.flipY = !!opts.origin.flip?.y

    this.#dir.n.h = opts.border?.n ?? opts.border?.s ?? this.#dir.n.h
    this.#dir.w.w = opts.border?.w ?? opts.border?.e ?? this.#dir.n.h
    this.#dir.e.w = opts.border?.e ?? this.#dir.w.w
    this.#dir.s.h = opts.border?.s ?? this.#dir.n.h

    this.#dir.nw.w = this.#dir.w.w
    this.#dir.nw.h = this.#dir.n.h
    this.#dir.ne.w = this.#dir.e.w
    this.#dir.ne.h = this.#dir.n.h
    this.#dir.se.w = this.#dir.e.w
    this.#dir.se.h = this.#dir.s.h
    this.#dir.sw.w = this.#dir.w.w
    this.#dir.sw.h = this.#dir.s.h

    this.#margin = {w: opts.margin?.w ?? 0, h: opts.margin?.h ?? 0}

    const w =
      opts.wh?.w == null
        ? this.#dir.w.w + this.#dir.n.w + this.#dir.e.w
        : opts.wh.w
    this.#dir.n.w = w - 1 // force resize
    this.wh = {
      w,
      h:
        opts.wh?.h == null
          ? this.#dir.n.h + this.#dir.e.h + this.#dir.s.h
          : opts.wh.h
    }

    this.#dir.nw.x = (opts.x ?? 0) - 1 // force move.
    this.xy = {x: opts.x ?? 0, y: opts.y ?? 0}
  }

  free(): void {
    this.#dir.w.free()
    this.#dir.nw.free()
    this.#dir.n.free()
    this.#dir.ne.free()
    this.#dir.e.free()
    this.#dir.se.free()
    this.#dir.s.free()
    this.#dir.sw.free()
    this.#dir.center.free()
  }

  update(): boolean | undefined {
    if (!this.#invalid) return
    this.#invalid = false
    return true
  }

  get wh(): WH {
    return {
      w: this.#dir.w.w + this.#dir.n.w + this.#dir.e.w + this.#margin.w,
      h: this.#dir.n.h + this.#dir.w.h + this.#dir.s.h + this.#margin.h
    }
  }

  set wh(wh: Readonly<WH>) {
    if (whEq(wh, this.wh)) return

    this.#dir.w.h = wh.h - this.#dir.n.h - this.#dir.s.h - this.#margin.h
    this.#dir.n.w = wh.w - this.#dir.w.w - this.#dir.e.w - this.#margin.w
    this.#dir.s.w = this.#dir.n.w
    this.#dir.e.h = this.#dir.w.h

    this.#dir.center.w = this.#dir.n.w
    this.#dir.center.h = this.#dir.e.h

    this.#setXYRight()

    this.#invalid = true
  }

  get xy(): XY {
    return {
      x: this.#dir.nw.x - this.#margin.w / 2,
      y: this.#dir.nw.y - this.#margin.h / 2
    }
  }

  set xy(xy: Readonly<XY>) {
    if (xyEq(xy, this.xy)) return

    this.#dir.nw.x = xy.x + this.#margin.w / 2
    this.#dir.nw.y = xy.y + this.#margin.h / 2
    this.#dir.w.x = this.#dir.nw.x
    this.#dir.w.y = this.#dir.nw.y + this.#dir.nw.h
    this.#dir.n.x = this.#dir.nw.x + this.#dir.nw.w
    this.#dir.n.y = this.#dir.nw.y

    this.#dir.center.x = this.#dir.n.x
    this.#dir.center.y = this.#dir.nw.y + this.#dir.ne.h

    this.#setXYRight()

    this.#invalid = true
  }

  #setXYRight() {
    this.#dir.ne.x = this.#dir.n.x + this.#dir.n.w
    this.#dir.ne.y = this.#dir.nw.y
    this.#dir.e.x = this.#dir.ne.x
    this.#dir.e.y = this.#dir.nw.y + this.#dir.ne.h
    this.#dir.se.x = this.#dir.e.x
    this.#dir.se.y = this.#dir.e.y + this.#dir.e.h
    this.#dir.s.x = this.#dir.n.x
    this.#dir.s.y = this.#dir.se.y
    this.#dir.sw.x = this.#dir.nw.x
    this.#dir.sw.y = this.#dir.se.y
  }
}
