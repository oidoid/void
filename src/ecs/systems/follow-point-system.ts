import { I16, I16XY, Immutable } from '@/oidlib'
import { ECSUpdate, Layer, Sprite, System } from '@/void'

export interface FollowPointSet {
  readonly followPoint: Record<never, never>
  readonly sprite: Sprite
}

export const FollowPointSystem: System<FollowPointSet> = Immutable({
  query: new Set(['followPoint', 'sprite']),
  updateEnt,
})

function updateEnt(set: FollowPointSet, update: ECSUpdate): void {
  const { sprite } = set

  if (update.input.xy != null) {
    sprite.moveTo(update.input.xy)
    setCursorLayer(sprite, update)
  } else {
    // to-do: limit to screen area.
    const speed = I16.trunc(Math.max(1, update.tick / 4))
    if (update.input.isOn('Left')) sprite.moveBy(new I16XY(-speed, 0)) // to-do: support XYArgs here.
    if (update.input.isOn('Right')) sprite.moveBy(new I16XY(speed, 0))
    if (update.input.isOn('Up')) sprite.moveBy(new I16XY(0, -speed))
    if (update.input.isOn('Down')) sprite.moveBy(new I16XY(0, speed))
    if (update.input.isAnyOn('Left', 'Right', 'Up', 'Down')) {
      setCursorLayer(sprite, update)
    }
  }
}

function setCursorLayer(sprite: Sprite, update: Readonly<ECSUpdate>): void {
  if (update.input.pointerType == null || update.input.pointerType == 'Mouse') {
    sprite.layer = Layer.Cursor
  } else if (
    update.input.pointerType == 'Pen' || update.input.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom
}
