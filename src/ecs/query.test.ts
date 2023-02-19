import { I4XY, U4Box } from '@/oidlib'
import { QueryToEnt } from '@/void'

interface BoxesEnt {
  readonly boxes: U4Box[]
}

interface NameEnt {
  readonly name: string
}

interface PositionEnt {
  readonly position: I4XY
}

interface Ent extends BoxesEnt, NameEnt, PositionEnt {}

export const testSingular: QueryToEnt<Ent, 'boxes'> = {
  boxes: [new U4Box(1, 2, 3, 4)],
}
testSingular.boxes.length

// @ts-expect-error test
export const testTypo: QueryToEnt<Ent, 'boxes2'> = {
  boxes: [new U4Box(1, 2, 3, 4)],
}

// @ts-expect-error test
export const testInvert: QueryToEnt<Ent, '!position'> = {
  boxes: [new U4Box(1, 2, 3, 4)],
}

export const testConjunction: QueryToEnt<Ent, 'boxes & position'> = {
  boxes: [new U4Box(1, 2, 3, 4)],
  position: new I4XY(1, 2),
}
testConjunction.boxes.length
testConjunction.position.abs

export const testUnion: QueryToEnt<Ent, 'boxes | position'> = {
  boxes: [new U4Box(1, 2, 3, 4)],
  position: new I4XY(1, 2),
}
if ('boxes' in testUnion) testUnion.boxes.length
if ('position' in testUnion) testUnion.position.abs
