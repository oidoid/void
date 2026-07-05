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
	"github.com/oidoid/void/src/void/vgeo"
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
	this.Layer(gfx.LayerTiles).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerTiles).AutoscaleMinClip = vgeo.WH[uint16]{
		W: gfx.LevelClipWPhy, H: gfx.LevelClipHPhy,
	}
	this.Layer(gfx.LayerSuperballs).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerSuperballs).AutoscaleMinClip = vgeo.WH[uint16]{
		W: gfx.LevelClipWPhy, H: gfx.LevelClipHPhy,
	}
	// to-do: use DPI to approximate physical sizes instead of guessing at phy
	// box multiples.
	this.Layer(gfx.LayerUI).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerUI).Depth = true
	this.Layer(gfx.LayerUI).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerUI).AutoscaleMinClip = vgeo.WH[uint16]{W: 192, H: 88}
	this.Layer(gfx.LayerUI).AutoscaleMaxScale = 6
	// to-do: experiment with glow.
	this.Layer(gfx.LayerOverlay).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerOverlay).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerOverlay).AutoscaleMinClip = vgeo.WH[uint16]{W: 1024, H: 768}
	this.Layer(gfx.LayerOverlay).AutoscaleMaxScale = 2
	this.Layer(gfx.LayerOverlay).BlendMode = vgfx.LayerBlendModeMultiply
	this.Layer(gfx.LayerOutline).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerOutline).ScaleMode = vgfx.LayerScaleModeManual
	this.Layer(gfx.LayerOutline).Scale = 1
	this.Layer(gfx.LayerOutline).Modulo = 1
	this.Layer(gfx.LayerCursor).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerCursor).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerCursor).AutoscaleMinClip = vgeo.WH[uint16]{W: 420, H: 320}
	this.Layer(gfx.LayerCursor).AutoscaleMaxScale = 4
	this.Atlas = vatlas.DecodeAtlas(assets.AtlasBin)
	return this
}

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	stat := this.Engine.BeginTick()
	stat |= this.Engine.Preupdate(this)
	stat |= this.Router.Update(this)
	this.Engine.EndTick()
	return stat
}
