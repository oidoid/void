package game

import (
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Game struct {
	*vengine.Engine[Game]
	Balls vvec.Vec[ents.BallEnt]
}

func New() *Game {
	return &Game{
		Engine: vengine.New[Game](&vengine.EngineOpts{
			Level:      &levels.InitLevel,
			MaxSprites: 2 * 1024 * 1024,
		}),
		Balls: vvec.New[ents.BallEnt](2 * 1024 * 1024),
	}
}

// to-do: separate method for resizing cam or whatever.
func (this *Game) Update() vgame.Status {
	var stat = this.Engine.Update()
	stat |= this.Router.Update(this)
	return stat
}
