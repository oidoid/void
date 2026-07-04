package engine

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type Engine struct {
	*vengine.Engine[*Engine]
	Balls ventdata.EntVec[*Engine, entdata.BallEnt]
}

var Version string
var _ vgame.Game = (*Engine)(nil)

func New() *Engine {
	font := vtext.MemProp5x6
	font.FirstAnimID = assets.MemProp5x600
	this := &Engine{
		Engine: vengine.New[*Engine](&vengine.EngineOpts{
			Font:       font,
			Level:      &levels.InitLevel,
			MaxSprites: 2 * 1024 * 1024,
		}),
	}
	this.Layer(gfx.LayerTiles).Shader = vgfx.ShaderTiles
	this.Layer(gfx.LayerUI).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerCursor).CamMode = vgfx.LayerCamModeFixed
	this.Atlas = vatlas.DecodeAtlas(assets.AtlasBin)
	return this
}

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	stat := this.Engine.BeginTick()
	stat |= this.Engine.Preupdate(this)
	this.Engine.UpdateLayerState()
	stat |= this.Router.Update(this)
	this.Engine.EndTick()
	return stat
}
