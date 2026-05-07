package vents

import "github.com/oidoid/void/src/void/vmem/vvec"

type UpdateAll[Game any, Ent any] = func(ents *vvec.Vec[Ent], gam Game)

type EntVec[Game any, Ent any] struct {
	vvec.Vec[Ent]
	update UpdateAll[Game, Ent]
}

func NewEntVec[Game any, Ent any](
	capacity int, update UpdateAll[Game, Ent],
) *EntVec[Game, Ent] {
	return &EntVec[Game, Ent]{
		Vec:    vvec.New[Ent](capacity),
		update: update,
	}
}

func (this *EntVec[Game, Ent]) Update(gam Game) {
	this.update(&this.Vec, gam)
}
