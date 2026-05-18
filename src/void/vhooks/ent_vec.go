package vhooks

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type UpdateAll[Game any, Ent any] = func(ents *vvec.Vec[Ent], gam Game) vgame.Status

// to-do: name? UpdateVec?
type EntVec[Game any, Ent any] struct {
	vvec.Vec[Ent]
	update UpdateAll[Game, Ent]
}

func NewEntVec[Game any, Ent any](
	update UpdateAll[Game, Ent], size ...int,
) *EntVec[Game, Ent] {
	return &EntVec[Game, Ent]{
		Vec:    vvec.New[Ent](size...),
		update: update,
	}
}

func (this *EntVec[Game, Ent]) Update(gam Game) vgame.Status {
	return this.update(&this.Vec, gam)
}
