package game

import (
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Game interface {
	vgame.Game
	Balls() *vvec.Vec[ents.BallEnt]
	Zoo() *vents.Zoo[Game]
}

// type Ent = vents.Ent[Game]
