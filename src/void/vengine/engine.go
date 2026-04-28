package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

var _ vgame.Game = (*Engine)(nil)

type Engine struct {
	Level   *vlevels.Level
	frame   vgame.Frame
	cam     vmath.XY[float32]
	rnd     *rand.Rand
	sprites vvec.Vec[vgfx.Sprite]
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
	if opts.Seed1 == 0 {
		opts.Seed1 = rand.Uint64()
	}
	if opts.Seed2 == 0 {
		opts.Seed2 = rand.Uint64()
	}
	return &Engine{
		rnd:     rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		sprites: vvec.New[vgfx.Sprite](opts.MaxSprites),
	}
}

func (this *Engine) Random() float32 { return this.rnd.Float32() }

func (this *Engine) Frame() *vgame.Frame { return &this.frame }

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

func (this *Engine) SpritePointer() uintptr          { return this.sprites.Pointer() }
func (this *Engine) SpriteCount() int                { return this.sprites.Len() }
func (this *Engine) Sprites() *vvec.Vec[vgfx.Sprite] { return &this.sprites }
func (this *Engine) TilePointer() uintptr            { return 0 }
func (this *Engine) TileCount() uint32               { return 0 }
func (this *Engine) LevelTileW() uint8               { return 0 }
func (this *Engine) LevelTileH() uint8               { return 0 }

func (this *Engine) Update() vgame.Status {
	return vgame.Pause
}
