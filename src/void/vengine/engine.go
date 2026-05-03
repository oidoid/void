package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
)

type Engine[Game any] struct {
	Level  *vlevels.Level
	Router vlevels.Router[Game]
	frame  vgame.Frame
	cam    vmath.XY[float32]
	ents   vents.Zoo[Game]
	// not true viewport size. adjusted by max sprite size.
	viewport    vmath.Box[float32]
	LevelBounds vmath.Box[float32] // to-do: can this be in vlevels.Level?
	rnd         *rand.Rand
	sprites     []vgfx.Sprite
}

type EngineOpts struct {
	Level      *vlevels.Level
	MaxSprites int
	Seed1      uint64
	Seed2      uint64
}

var _ vgame.Game = (*Engine[any])(nil)

func New[Game any](opts *EngineOpts) *Engine[Game] {
	if opts == nil {
		opts = &EngineOpts{}
	}
	if opts.MaxSprites == 0 {
		opts.MaxSprites = 1024 * 1024
	}
	if opts.Seed1 == 0 {
		opts.Seed1 = rand.Uint64()
	}
	if opts.Seed2 == 0 {
		opts.Seed2 = rand.Uint64()
	}
	return &Engine[Game]{
		Level:   opts.Level,
		rnd:     rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		sprites: make([]vgfx.Sprite, 0, opts.MaxSprites),
	}
}

func (this *Engine[Game]) Random() float32 { return this.rnd.Float32() }

func (this *Engine[Game]) RegisterEntUpdate(update func(*Game)) {
	this.ents.Register(update)
}

func (this *Engine[Game]) Frame() *vgame.Frame { return &this.frame }

func (this *Engine[Game]) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine[Game]) Cam() *vmath.XY[float32]   { return &this.cam }
func (this *Engine[Game]) CamX() float32             { return this.cam.X }
func (this *Engine[Game]) CamY() float32             { return this.cam.Y }
func (this *Engine[Game]) Canvas() *vmath.WH[uint16] { return &this.frame.Canvas }
func (this *Engine[Game]) Input() *vinput.Input      { return &this.frame.Input }

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
func (this *Engine[Game]) DrawSprite(sprite *vgfx.Sprite) {
	if !this.viewport.HitsXY(sprite.XY) {
		return
	}
	n := len(this.sprites)
	this.sprites = this.sprites[:n+1]
	this.sprites[n] = *sprite
}
func (this *Engine[Game]) BeginDraw() vgfx.SpriteBatch {
	return vgfx.SpriteBatch{Sprites: this.sprites, Viewport: this.viewport}
}
func (this *Engine[Game]) EndDraw(batch vgfx.SpriteBatch) { this.sprites = batch.Sprites }

func (this *Engine[Game]) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.Level.Tiles[0]))
}
func (this *Engine[Game]) TileCount() uint32 {
	return uint32(len(this.Level.Tiles))
}
func (this *Engine[Game]) LevelTileW() uint8 { return this.Level.Tile.W }
func (this *Engine[Game]) LevelTileH() uint8 { return this.Level.Tile.H }

func (this *Engine[Game]) Update() vgame.Status {
	this.sprites = this.sprites[:0]
	w := float32(this.frame.Canvas.W)
	h := float32(this.frame.Canvas.H)
	r := vgfx.MaxRadius
	this.viewport = vmath.NewBox(this.cam.X-r, this.cam.Y-r, this.cam.X+w+r, this.cam.Y+h+r)
	this.LevelBounds = vmath.NewBox(
		float32(this.Level.Min.X), float32(this.Level.Min.Y),
		float32(this.Level.Max.X), float32(this.Level.Max.Y),
	)
	return vgame.Pause
}

func (this *Engine[Game]) Ents() *vents.Zoo[Game] {
	return &this.ents
}
