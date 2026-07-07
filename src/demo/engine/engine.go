package engine

import (
	"math"

	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type Engine struct {
	*vengine.Engine[*Engine]
	Balls ventities.EntVec[*Engine, entities.BallEnt]
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
	this.Layer(gfx.LayerUI).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerUI).Depth = true
	this.Layer(gfx.LayerUI).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerUI).AutoscaleMinClip = vgeo.WH[uint16]{W: 192, H: 88}
	this.Layer(gfx.LayerOverlay).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerOverlay).Shader = vgfx.ShaderOverlay
	this.Layer(gfx.LayerOverlay).BlendMode = vgfx.LayerBlendModeReplace
	this.Layer(gfx.LayerOutline).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerCursor).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerGrid).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerGrid).BlendMode = vgfx.LayerBlendModeMultiply
	this.Atlas = vatlas.DecodeAtlas(assets.AtlasBin)
	return this
}

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	stat := this.Engine.BeginTick()
	dpr := this.Frame().DevicePixelRatio
	this.Layer(gfx.LayerUI).AutoscaleMaxScale = uint8(math.Round(3 * dpr))
	this.Layer(gfx.LayerOverlay).Scale = float32(math.Round(3 * dpr))
	this.Layer(gfx.LayerCursor).Scale = float32(math.Round(2 * dpr))
	this.Layer(gfx.LayerGrid).Scale = float32(math.Round(dpr))
	stat |= this.Engine.Preupdate(this)
	stat |= this.Router.Update(this)
	this.Engine.EndTick()
	return stat
}
