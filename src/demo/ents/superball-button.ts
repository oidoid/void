import * as V from '../../engine/index.ts'
import {parseSprite} from '../../engine/level/level-parser.ts'

export type SuperballButtonEnt = V.HookEnt<SuperballButtonHook>

export class SuperballButtonHook implements V.Hook {
  readonly query = 'button & superballButton & sprite'

  update(ent: SuperballButtonEnt, v: V.Void): void {
    if (!V.buttonOn(ent)) return

    for (let i = 0; i < 100; i++) {
      const angle = v.random.num * Math.PI * 2
      const speed = 20 + 100 * v.random.num
      const sprite = parseSprite(
        {tag: 'superball--Default', x: ent.sprite.x, y: ent.sprite.y, z: 'C'},
        v.pool,
        v.atlas.default
      )
      sprite.angle = angle * 180 * Math.PI
      const superball: V.Ent = {
        name: `Superball ${i}`,
        sprite,
        superball: {vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed}
      }

      v.loader.zoo.default.add(superball)
    }

    v.invalid = true
  }
}
