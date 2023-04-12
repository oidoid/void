import { Box, XY } from '@/ooz'
import { QueryEnt } from '@/void'

interface BoxesEnt {
  readonly boxes: Box[]
}

interface NameEnt {
  readonly name: string
}

interface PositionEnt {
  readonly position: XY
}

interface Ent extends BoxesEnt, NameEnt, PositionEnt {}

export const testSingular: QueryEnt<Ent, 'boxes'> = {
  boxes: [new Box(1, 2, 3, 4)],
}
testSingular.boxes.length

// @ts-expect-error test
export const testTypo: QueryEnt<Ent, 'boxes2'> = {
  boxes: [new Box(1, 2, 3, 4)],
}

// @ts-expect-error test
export const testInvert: QueryEnt<Ent, '!position'> = {
  boxes: [new Box(1, 2, 3, 4)],
}

export const testConjunction: QueryEnt<Ent, 'boxes & position'> = {
  boxes: [new Box(1, 2, 3, 4)],
  position: new XY(1, 2),
}
testConjunction.boxes.length
testConjunction.position.abs

export const testUnion: QueryEnt<Ent, 'boxes | position'> = {
  boxes: [new Box(1, 2, 3, 4)],
  position: new XY(1, 2),
}
if ('boxes' in testUnion) testUnion.boxes.length
if ('position' in testUnion) testUnion.position.abs
