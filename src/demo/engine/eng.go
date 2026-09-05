package engine

import (
	"math"

	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vgrid"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type Eng struct {
	*vengine.Eng[*Eng]
	Superballs     ventities.EntVec[*Eng, entities.SuperballEnt]
	HitSuperballs  bool
	BeepSuperballs bool
	SuperballGrid  vgrid.Grid
	LastBoingMs    float64
	LvlZoom        float32 // absolute lvl scale; zero uses the fitted scale.
	// to-do: Cam struct.
	CamKeyPhy        vgeo.XY[float32] // accumulates keyboard movement in phy coordinates.
	CamZoomAnchorPhy vgeo.XY[float32]
	CamPanOn         bool
	CamZoomOn        bool
}

type entUpdater struct {
	ent ventities.Updater[game.Game]
}

func (this entUpdater) Update(gam *Eng) vgame.Status {
	return this.ent.Update(gam)
}

var Version string
var _ vgame.Game = (*Eng)(nil)

const (
	lvlScaleMin = float32(1)
	lvlScaleMax = float32(80)
)

func New() *Eng {
	font := vtext.MemProp5x6
	font.FirstTag = tags.MemProp5x600
	this := &Eng{
		Eng: vengine.New[*Eng](&vengine.EngOpts{
			Font:       font,
			RenderMode: vgfx.RenderModePixel,
		}),
		LastBoingMs: -math.MaxFloat64,
	}
	this.Layer(gfx.LayerTiles).Shader = vgfx.ShaderTiles
	this.Layer(gfx.LayerTiles).ScaleMode = vgfx.LayerScaleModeManual
	this.Layer(gfx.LayerP1).ScaleMode = vgfx.LayerScaleModeManual
	this.Layer(gfx.LayerSuperballs).ScaleMode = vgfx.LayerScaleModeManual
	*this.Cam() = this.Layer(gfx.LayerSuperballs).LayerToPhyScale(
		vgeo.NewXY[float32](-96, -96),
	)
	this.Layer(gfx.LayerUI).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerUI).Depth = true
	this.Layer(gfx.LayerUI).ScaleMode = vgfx.LayerScaleModeAutoInt
	this.Layer(gfx.LayerUI).AutoscaleMinClip = vgeo.NewWH[uint16](256, 48)
	this.Layer(gfx.LayerOverlay).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerOverlay).Shader = vgfx.ShaderOverlay
	this.Layer(gfx.LayerOverlay).BlendMode = vgfx.LayerBlendModeReplace
	this.Layer(gfx.LayerViewportEdge).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerCursor).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerGrid).CamMode = vgfx.LayerCamModeFixed
	this.Layer(gfx.LayerGrid).BlendMode = vgfx.LayerBlendModeMultiply
	this.Atlas = vatlas.DecodeAtlas(assets.AtlasBin)
	return this
}

func (this *Eng) SetBoard(board *vboards.Board) {
	this.BoardData = board
	anim := this.Atlas.Anims[int(tags.SuperballDefault)]
	diameter := float32(anim.Hitbox.Max.X - anim.Hitbox.Min.X)
	// omit board edge.
	bounds := vgeo.NewBox(
		float32(board.Tile.W),
		float32(board.Tile.H),
		float32(board.W-int32(board.Tile.W)),
		float32(board.H-int32(board.Tile.H)),
	)
	this.SuperballGrid = vgrid.New(bounds, diameter, 2*1024*1024)
}

func (this *Eng) Register(ent ventities.Updater[game.Game]) {
	this.RegisterUpdate(entUpdater{ent})
}

func (this *Eng) SuperballCount() int { return this.Superballs.Len() }

func (this *Eng) UpdateLvlLayers() {
	canvasPhy := *this.CanvasPhy()
	baseScale := lvlScale(canvasPhy)
	scale := this.lvlZoom(baseScale)
	this.applyLvlScale(canvasPhy, baseScale, scale)
}

func (this *Eng) applyLvlScale(
	canvasPhy vgeo.WH[uint16],
	baseScale uint16,
	scale float32,
) vgeo.Box[uint16] {
	this.LvlZoom = scale
	clipW := gfx.LevelClipWPhy * baseScale
	clipH := gfx.LevelClipHPhy * baseScale
	clipPhy := vgeo.XYWH(
		centerOffset(canvasPhy.W, clipW),
		centerOffset(canvasPhy.H, clipH),
		clipW,
		clipH,
	)
	this.Layer(gfx.LayerTiles).ClipPhy = clipPhy
	this.Layer(gfx.LayerTiles).Scale = scale
	this.Layer(gfx.LayerP1).ClipPhy = clipPhy
	this.Layer(gfx.LayerP1).Scale = scale
	this.Layer(gfx.LayerSuperballs).ClipPhy = clipPhy
	this.Layer(gfx.LayerSuperballs).Scale = scale
	return clipPhy
}

// adjusts lvl zoom while keeping the point at phy fixed on screen.
func (this *Eng) ZoomLvlAt(phy vgeo.XY[float32], by float32) bool {
	if by <= 0 {
		return false
	}
	baseScale := lvlScale(*this.CanvasPhy())
	scale := this.lvlZoom(baseScale) * by
	return this.setLvlScaleAt(phy, scale)
}

// adjusts lvl scale while keeping the point at phy fixed on screen.
func (this *Eng) AdjustLvlScaleAt(phy vgeo.XY[float32], by float32) bool {
	baseScale := lvlScale(*this.CanvasPhy())
	scale := this.lvlZoom(baseScale) + by
	return this.setLvlScaleAt(phy, scale)
}

// resets lvl scale to the fitted scale while keeping the point at phy fixed.
func (this *Eng) ResetLvlScaleAt(phy vgeo.XY[float32]) bool {
	return this.setLvlScaleAt(phy, float32(lvlScale(*this.CanvasPhy())))
}

func (this *Eng) setLvlScaleAt(
	phy vgeo.XY[float32],
	scale float32,
) bool {
	canvasPhy := *this.CanvasPhy()
	baseScale := lvlScale(canvasPhy)
	scale = clampLvlScale(scale)
	if scale == this.lvlZoom(baseScale) {
		return false
	}
	tiles := this.Layer(gfx.LayerTiles)
	oldClipPhy := tiles.ClipPhy
	oldScale := tiles.ScaleOrDefault()
	cam := *this.Cam()
	clipPhy := this.applyLvlScale(canvasPhy, baseScale, scale)
	ratio := scale / oldScale
	// scales cam's old clip-relative distance about phy, then shifts it into the
	// new clip so phy stays fixed on screen.
	this.Cam().X =
		(phy.X-float32(oldClipPhy.Min.X)+cam.X)*ratio +
			float32(clipPhy.Min.X) - phy.X
	this.Cam().Y =
		(phy.Y-float32(oldClipPhy.Min.Y)+cam.Y)*ratio +
			float32(clipPhy.Min.Y) - phy.Y
	return true
}

func (this *Eng) lvlZoom(baseScale uint16) float32 {
	zoom := this.LvlZoom
	if zoom == 0 {
		zoom = float32(baseScale)
	}
	return clampLvlScale(zoom)
}

func centerOffset(canvas, clip uint16) uint16 {
	if canvas <= clip {
		return 0
	}
	return (canvas - clip) / 2
}

func lvlScale(canvasPhy vgeo.WH[uint16]) uint16 {
	scale := canvasPhy.W / gfx.LevelClipWPhy
	if hScale := canvasPhy.H / gfx.LevelClipHPhy; hScale < scale {
		scale = hScale
	}
	if scale == 0 {
		return 1
	}
	return scale
}

func clampLvlScale(scale float32) float32 {
	if scale < lvlScaleMin {
		return lvlScaleMin
	}
	if scale > lvlScaleMax {
		return lvlScaleMax
	}
	return scale
}

func (this *Eng) Boing(dx, dy float32) {
	if !this.BeepSuperballs || this.NowMillis()-this.LastBoingMs < 40 {
		return
	}
	this.LastBoingMs = this.NowMillis()
	speed := float32(math.Hypot(float64(dx), float64(dy)))
	hz := 100 * (0.5 + this.Random()) * min(max(speed/80, 2), 5)
	this.Beep(vgame.Beep{
		StartHz: hz, EndHz: hz * 0.9, DurationMs: 120,
	})
}

// to-do: separate method for resizing cam or whatever.
func (this *Eng) Update() vgame.Status {
	stat := this.Eng.BeginTick()
	dpr := this.Frame().DevicePixelRatio
	this.Layer(gfx.LayerUI).AutoscaleMaxScale = uint8(vmath.Round(3 * dpr))
	this.Layer(gfx.LayerOverlay).Scale = float32(vmath.Round(3 * dpr))
	this.Layer(gfx.LayerCursor).Scale = float32(vmath.Round(2 * dpr))
	this.Layer(gfx.LayerGrid).Scale = float32(math.Floor(dpr))
	stat |= this.Eng.Preupdate(this)
	stat |= this.Router.Update(this)
	return this.Eng.EndTick(stat)
}
