import { Int, NumXY } from '@/oidlib'
import { ECS, Ent } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

type Components = {
  readonly name: string
  readonly position: NumXY
  readonly bags: Int
}

Deno.test('ECS stores and retrieves component.', () => {
  const ecs = ECS<Components>(new Set())
  ECS.addEnt(ecs, { name: 'name', position: new NumXY(1, 2), bags: Int(1) })
  ECS.flush(ecs)
  const bags = ECS.get(ecs, Ent(1), 'bags')
  assertEquals(bags, Int(1))
})

Deno.test('ECS stores and retrieves component tuple.', () => {
  const ecs = ECS<Components>(new Set())
  ECS.addEnt(ecs, { name: 'name', position: new NumXY(1, 2), bags: Int(1) })
  ECS.flush(ecs)
  const [position, name] = ECS.get(ecs, Ent(1), 'position', 'name')
  assertEquals(position, new NumXY(1, 2))
  assertEquals(name, 'name')
})
