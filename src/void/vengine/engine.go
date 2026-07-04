// ╭>°╮┬┌─╮╭─╮┬┌─╮
// ╰──╰┴╯─╯╰─╰┴╯─╯
package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vtext"
)

type Engine[Game vgame.Game] struct {
	Level       *vlevels.Level
	Router      vlevels.Router[Game]
	Atlas       vatlas.Atlas
	Texts       ventdata.EntVec[Game, ventdata.TextEnt]
	font        *vtext.Font
	frame       vgame.Poll
	in          *vinput.In
	cam         vgeo.XY[float32] // to-do: cam always moves in physical space.
	preupdaters ventdata.Zoo[Game]
	updaters    ventdata.Zoo[Game]
	// not true viewport size. adjusted by max sprite size. to-do: call canvas? drop?
	viewport          vgeo.Box[float32]
	LevelBounds       vgeo.Box[float32] // to-do: can this be in vlevels.Level?
	rnd               *rand.Rand
	layers            [vgfx.LayerCount]vgfx.LayerConfig
	layerConfigExport [vgfx.LayerCount]vgfx.LayerConfigExport
	tick              vgame.Tick
}

type EngineOpts struct {
	Font       *vtext.Font
	Level      *vlevels.Level
	MaxSprites int
	Seed1      uint64
	Seed2      uint64
}

func New[Game vgame.Game](opts *EngineOpts) *Engine[Game] {
	if opts == nil {
		opts = &EngineOpts{}
	}
	if opts.MaxSprites == 0 {
		opts.MaxSprites = 16 * 1024
	}
	if opts.Seed1 == 0 {
		opts.Seed1 = rand.Uint64()
	}
	if opts.Seed2 == 0 {
		opts.Seed2 = rand.Uint64()
	}
	this := &Engine[Game]{
		font:  opts.Font,
		Level: opts.Level,
		in:    vinput.NewIn(),
		rnd:   rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
	}
	for i := range this.layers {
		this.layers[i] = vgfx.NewLayerConfig(opts.MaxSprites)
	}
	return this
}

func (this *Engine[Game]) Random() float32 { return this.rnd.Float32() }

func (this *Engine[Game]) RegisterEntUpdate(
	vec interface{ Update(Game) vgame.Status },
) {
	this.updaters.Register(vec.Update)
}

func (this *Engine[Game]) RegisterPreupdate(fn func(Game) vgame.Status) {
	this.preupdaters.Register(fn)
}

func (this *Engine[Game]) RegisterUpdate(fn func(Game) vgame.Status) {
	this.updaters.Register(fn)
}

func (this *Engine[Game]) Font() *vtext.Font {
	return this.font
}

func (this *Engine[Game]) Frame() *vgame.Poll { return &this.frame }
func (this *Engine[Game]) Fullscreen() bool   { return this.frame.Fullscreen }
func (this *Engine[Game]) NowMs() float64     { return this.frame.NowMs }
func (this *Engine[Game]) Tick() *vgame.Tick  { return &this.tick }

func (this *Engine[Game]) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine[Game]) Cam() *vgeo.XY[float32] { return &this.cam }
func (this *Engine[Game]) CamX() float32          { return this.cam.X }
func (this *Engine[Game]) CamY() float32          { return this.cam.Y }

// to-do: add ViewportPhy?
func (this *Engine[Game]) CanvasPhy() *vgeo.WH[uint16] {
	return &this.frame.CanvasPhy
}
func (this *Engine[Game]) In() *vinput.In {
	return this.in
}

func (this *Engine[Game]) LevelX() int32 { return this.Level.Min.X }
func (this *Engine[Game]) LevelY() int32 { return this.Level.Min.Y }
func (this *Engine[Game]) LevelW() int32 { return this.Level.W() }
func (this *Engine[Game]) LevelH() int32 { return this.Level.H() }

func (this *Engine[Game]) LayerConfigsPointer() uintptr {
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.layerConfigExport[:])))
}
func (this *Engine[Game]) Layer(layer vgfx.Layer) *vgfx.LayerConfig {
	return &this.layers[layer]
}

func (this *Engine[Game]) Viewport() vgeo.Box[float32] {
	return this.viewport
}

func (this *Engine[Game]) TilePointer() uintptr {
	if this.Level == nil || len(this.Level.Tiles) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(&this.Level.Tiles[0]))
}
func (this *Engine[Game]) TileCount() uint32 {
	return uint32(len(this.Level.Tiles))
}
func (this *Engine[Game]) LevelTileW() uint8 { return this.Level.Tile.W }
func (this *Engine[Game]) LevelTileH() uint8 { return this.Level.Tile.H }

func (this *Engine[Game]) EndTick() {
	this.tick.DeltaMs = this.frame.DeltaMs
	// to-do: make frame finalization explicit instead of hanging this off
	// EndTick.
	this.updateLayerConfigExport()
}

func (this *Engine[Game]) Preupdate(gam Game) vgame.Status {
	return this.preupdaters.Update(gam)
}

func (this *Engine[Game]) UpdateLayerState() {
	this.updateLayerClips()
	this.updateViewport()
}

func (this *Engine[Game]) Ents() *ventdata.Zoo[Game] {
	return &this.updaters
}

func (this *Engine[Game]) AtlasAnimCount() uint32 {
	return uint32(len(this.Atlas.Anims))
}

func (this *Engine[Game]) AtlasCelsPerAnim() uint32 {
	return uint32(vatlas.CelsPerAnim)
}

func (this *Engine[Game]) AtlasCelsPointer() uintptr {
	if len(this.Atlas.Cels) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.Atlas.Cels)))
}

func (this *Engine[Game]) AtlasCelsCount() uint32 {
	return uint32(len(this.Atlas.Cels))
}

func (this *Engine[Game]) BeginTick() vgame.Status {
	this.in.Update(
		this.frame.NowMs,
		&this.frame.InputPoll,
		vgeo.Box[float32]{Min: this.cam}, // to-do: actual cam box.
	)
	this.tick.DrawMs = this.frame.DrawMs
	for i := range this.layers {
		this.layers[i].Sprites = this.layers[i].Sprites[:0]
	}
	this.LevelBounds = vgeo.NewBox(
		float32(this.Level.Min.X),
		float32(this.Level.Min.Y),
		float32(this.Level.Max.X),
		float32(this.Level.Max.Y),
	)
	return vgame.Pause
}

func (this *Engine[Game]) updateLayerClips() {
	for i := range this.layers {
		config := &this.layers[i]
		config.UpdateCam(this.cam)
		clip := config.ClipPhy
		clipX := float32(clip.Min.X)
		clipY := float32(clip.Min.Y)
		clipW := float32(clip.W())
		clipH := float32(clip.H())
		if clipW == 0 || clipH == 0 {
			clipX = 0
			clipY = 0
			clipW = float32(this.frame.CanvasPhy.W)
			clipH = float32(this.frame.CanvasPhy.H)
		}
		config.UpdateScale(vgeo.WH[float32]{W: clipW, H: clipH})
		min := config.PhyToLayer(vgeo.NewXY(clipX, clipY))
		max := config.PhyToLayer(vgeo.NewXY(clipX+clipW, clipY+clipH))
		size := vgfx.MaxSpriteSize
		config.Clip = vgeo.NewBox(
			min.X-size,
			min.Y-size,
			max.X+size,
			max.Y+size,
		)
	}
}

func (this *Engine[Game]) updateLayerConfigExport() {
	for i := range this.layers {
		layer := &this.layers[i]
		sprites := layer.Sprites
		spritesPtr := uint32(0)
		if len(sprites) != 0 {
			spritesPtr = uint32(uintptr(unsafe.Pointer(unsafe.SliceData(sprites))))
		}
		noDepth := uint8(0)
		if layer.NoDepth {
			noDepth = 1
		}
		this.layerConfigExport[i] = vgfx.LayerConfigExport{
			RenderMode:  layer.RenderMode,
			CamMode:     layer.CamMode,
			Shader:      layer.Shader,
			NoDepth:     noDepth,
			ClipXPhy:    layer.ClipPhy.Min.X,
			ClipYPhy:    layer.ClipPhy.Min.Y,
			ClipWPhy:    layer.ClipPhy.W(),
			ClipHPhy:    layer.ClipPhy.H(),
			Scale:       layer.ScaleOrDefault(),
			SpritesPtr:  spritesPtr,
			SpriteCount: uint32(len(sprites)),
		}
	}
}

func (this *Engine[Game]) updateViewport() {
	w := float32(this.frame.CanvasPhy.W)
	h := float32(this.frame.CanvasPhy.H)
	r := vgfx.MaxSpriteSize
	// to-do: this is all in physical pixels which is probably incorrect. how to get offset to origin? how to get level pixels?
	this.viewport = vgeo.NewBox(
		this.cam.X-r,
		this.cam.Y-r,
		this.cam.X+w+r,
		this.cam.Y+h+r,
	)
}
