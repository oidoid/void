package engine

import (
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

var Version string

type Engine struct {
	*vengine.Engine[Engine]
	Balls vvec.Vec[ents.BallEnt]
}

func New() *Engine {
	return &Engine{
		Engine: vengine.New[Engine](&vengine.EngineOpts{
			Level:      &levels.InitLevel,
			MaxSprites: 2 * 1024 * 1024,
		}),
		Balls: vvec.New[ents.BallEnt](2 * 1024 * 1024),
	}
}

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	var stat = this.Engine.Update()
	stat |= this.Router.Update(this)
	return stat
}
