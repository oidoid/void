package vengine

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
)

var _ vgame.Game = (*Engine)(nil)

type Engine struct {
	Level *vlevels.Level
	frame vgame.Frame
	cam   vmath.XY[float32]
	rnd   vmath.Random
}

func NewEngine() *Engine {
	return &Engine{rnd: vmath.NewRandom()}
}

func (this *Engine) Random() float32 { return this.rnd.Float32() }

func (this *Engine) Frame() *vgame.Frame { return &this.frame }

func (this *Engine) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine) Cam() *vmath.XY[float32] { return &this.cam }
func (this *Engine) CamX() float32           { return this.cam.X }
func (this *Engine) CamY() float32           { return this.cam.Y }

func (this *Engine) LevelX() int16  { return this.Level.X }
func (this *Engine) LevelY() int16  { return this.Level.Y }
func (this *Engine) LevelW() uint16 { return this.Level.W }
func (this *Engine) LevelH() uint16 { return this.Level.H }

func (this *Engine) SpritePointer() uintptr { return 0 }
func (this *Engine) SpriteCount() int       { return 0 }
func (this *Engine) TilePointer() uintptr   { return 0 }
func (this *Engine) TileCount() uint32      { return 0 }
func (this *Engine) LevelTileW() uint8      { return 0 }
func (this *Engine) LevelTileH() uint8      { return 0 }

func (this *Engine) Update() vgame.Status {
	return vgame.Pause
}
