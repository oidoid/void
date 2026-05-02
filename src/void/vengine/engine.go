package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
)

type Engine struct {
	Level *vlevels.Level
	frame Frame
	cam   vmath.XY[float32]
	// not true viewport size. adjusted by max sprite size.
	viewport    vmath.Bounds[float32]
	LevelBounds vmath.Bounds[float32] // to-do: can this be in vlevels.Level?
	rnd         *rand.Rand
	sprites     []vgfx.Sprite
}

type EngineOpts struct {
	MaxSprites int
	Seed1      uint64
	Seed2      uint64
}

func New(opts *EngineOpts) *Engine {
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
	return &Engine{
		rnd:     rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		sprites: make([]vgfx.Sprite, 0, opts.MaxSprites),
	}
}

func (this *Engine) Random() float32 { return this.rnd.Float32() }

func (this *Engine) Frame() *Frame { return &this.frame }

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine) Cam() *vmath.XY[float32]   { return &this.cam }
func (this *Engine) CamX() float32             { return this.cam.X }
func (this *Engine) CamY() float32             { return this.cam.Y }
func (this *Engine) Canvas() *vmath.WH[uint16] { return &this.frame.Canvas }
func (this *Engine) Input() *vinput.Input      { return &this.frame.Input }

func (this *Engine) LevelX() int16  { return this.Level.X }
func (this *Engine) LevelY() int16  { return this.Level.Y }
func (this *Engine) LevelW() uint16 { return this.Level.W }
func (this *Engine) LevelH() uint16 { return this.Level.H }

func (this *Engine) SpritePointer() uintptr {
	if cap(this.sprites) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.sprites)))
}
func (this *Engine) SpriteCount() int        { return len(this.sprites) }
func (this *Engine) Sprites() *[]vgfx.Sprite { return &this.sprites }
func (this *Engine) DrawSprite(sprite *vgfx.Sprite) {
	if !this.viewport.HitsXY(sprite.XY) {
		return
	}
	n := len(this.sprites)
	this.sprites = this.sprites[:n+1]
	this.sprites[n] = *sprite
}
func (this *Engine) TilePointer() uintptr { return 0 }
func (this *Engine) TileCount() uint32    { return 0 }
func (this *Engine) LevelTileW() uint8    { return 0 }
func (this *Engine) LevelTileH() uint8    { return 0 }

func (this *Engine) Update() Status {
	this.sprites = this.sprites[:0]
	w := float32(this.frame.Canvas.W)
	h := float32(this.frame.Canvas.H)
	r := vgfx.MaxRadius
	this.viewport = vmath.NewBounds(this.cam.X-r, this.cam.Y-r, this.cam.X+w+r, this.cam.Y+h+r)
	this.LevelBounds = vmath.NewBounds(
		float32(this.Level.X), float32(this.Level.Y),
		float32(this.Level.X)+float32(this.Level.W),
		float32(this.Level.Y)+float32(this.Level.H),
	)
	return Pause
}
