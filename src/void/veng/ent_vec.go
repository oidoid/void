package veng

import (
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// to-do: name? UpdateVec? HookVec? Engine.updaters?
type EntVec[Game any, Ent any] struct {
	vvec.Vec[Ent]
	update func(*vvec.Vec[Ent], Game) Status
}

func NewEntVec[Game any, Ent any](
	update func(*vvec.Vec[Ent], Game) Status,
	size ...int,
) *EntVec[Game, Ent] {
	return &EntVec[Game, Ent]{Vec: vvec.New[Ent](size...), update: update}
}

func (this *EntVec[Game, Ent]) Update(gam Game) Status {
	return this.update(&this.Vec, gam)
}
