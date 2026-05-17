package engine

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/ents/entdata"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
)

type Engine struct {
	*vengine.Engine[*Engine]
	Balls vents.EntVec[*Engine, entdata.BallEnt]
}

var Version string
var _ vgame.Game = (*Engine)(nil)

func New(balls *vents.EntVec[*Engine, entdata.BallEnt]) *Engine {
	this := &Engine{
		Engine: vengine.New[*Engine](&vengine.EngineOpts{
			Level: &levels.InitLevel,
			MaxSprites: 2 * 1024 * 1024,
		}),
		Balls: *balls,
	}
	this.Atlas = vatlas.DecodeAtlas(assets.AtlasBin)
	return this
}

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	stat := this.Engine.Update()
	stat |= this.Router.Update(this)
	return stat
}
