// ╭>°╮┬┌─╮╭─╮┬┌─╮
// ╰──╰┴╯─╯╰─╰┴╯─╯
package vengine

import (
	"time"
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
	Level    *vlevels.Level
	Router   vlevels.Router[Game]
	Atlas    vatlas.Atlas
	Texts    ventdata.EntVec[Game, ventdata.TextEnt]
	font     *vtext.Font
	frame    vgame.Poll
	cam      vgeo.XY[float32]
	updaters ventdata.Zoo[Game]
	// not true viewport size. adjusted by max sprite size.
	viewport    vgeo.Box[float32]
	LevelBounds vgeo.Box[float32] // to-do: can this be in vlevels.Level?
	rnd         *rand.Rand
	sprites     []vgfx.Sprite
	tick        vgame.Tick
	tickStart   time.Time
}

type EngineOpts struct {
	Font       *vtext.Font
	Level      *vlevels.Level
	MaxSprites int
	Seed1      uint64
	Seed2      uint64
}

var _ vgame.Game = (*Engine[vgame.Game])(nil)

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
	return &Engine[Game]{
		font:    opts.Font,
		Level:   opts.Level,
		rnd:     rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		sprites: make([]vgfx.Sprite, 0, opts.MaxSprites),
	}
}

func (this *Engine[Game]) Random() float32 { return this.rnd.Float32() }

func (this *Engine[Game]) RegisterEntUpdate(
	vec interface{ Update(Game) vgame.Status },
) {
	this.updaters.Register(vec.Update)
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
func (this *Engine[Game]) CanvasPhy() *vgeo.WH[uint16] {
	return &this.frame.CanvasPhy
}
func (this *Engine[Game]) Input() *vinput.InputPoll {
	return &this.frame.InputPoll
}

func (this *Engine[Game]) LevelX() int32 { return this.Level.Min.X }
func (this *Engine[Game]) LevelY() int32 { return this.Level.Min.Y }
func (this *Engine[Game]) LevelW() int32 { return this.Level.W() }
func (this *Engine[Game]) LevelH() int32 { return this.Level.H() }

func (this *Engine[Game]) SpritePointer() uintptr {
	if cap(this.sprites) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.sprites)))
}
func (this *Engine[Game]) SpriteCount() int { return len(this.sprites) }
func (this *Engine[Game]) Sprites() *[]vgfx.Sprite {
	return &this.sprites
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
	this.tick.DeltaMs = float64(time.Since(this.tickStart).Nanoseconds()) / 1e6
}

func (this *Engine[Game]) Update() vgame.Status {
	this.tickStart = time.Now()
	this.tick.DrawMs = this.frame.DrawMs
	this.sprites = this.sprites[:0]
	w := float32(this.frame.CanvasPhy.W)
	h := float32(this.frame.CanvasPhy.H)
	r := vgfx.MaxSpriteSize
	// to-do: this is all in physical pixels which is probably incorrect.
	this.viewport = vgeo.NewBox(
		this.cam.X-r,
		this.cam.Y-r,
		this.cam.X+w+r,
		this.cam.Y+h+r,
	)
	this.LevelBounds = vgeo.NewBox(
		float32(this.Level.Min.X),
		float32(this.Level.Min.Y),
		float32(this.Level.Max.X),
		float32(this.Level.Max.Y),
	)
	return vgame.Pause
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
