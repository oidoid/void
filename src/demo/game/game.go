package game

import (
	"unsafe"

	"github.com/oidoid/void/src/demo"
	V "github.com/oidoid/void/src/engine"
	"github.com/oidoid/void/src/engine/input"
)

type Game struct {
	engine V.Engine
}

var version string

func NewGame() Game {
	return Game{engine: V.NewEngine()}
}

var _ V.WasmAPI = (*Game)(nil)

func (this *Game) FramePointer() uintptr {
	return this.engine.FramePointer()
}

func (this *Game) SpritePointer() uintptr {
	return this.engine.SpritePointer()
}

func (this *Game) SpriteCount() uint32 {
	return this.engine.SpriteCount()
}

func (this *Game) Update() V.LoopState {
	loop := this.engine.Update()
	frame := this.engine.Frame()
	kbd := &frame.Input.Keyboard
	const camSpeed = float32(1) // px/ms = 100 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if kbd.Keys&input.KeyC != 0 {
		dx *= 10
	}
	if kbd.Keys&input.KeyLeft != 0 {
		this.engine.Cam.X -= dx
		loop = V.Loop
	}
	if kbd.Keys&input.KeyRight != 0 {
		this.engine.Cam.X += dx
		loop = V.Loop
	}
	if kbd.Keys&input.KeyUp != 0 {
		this.engine.Cam.Y -= dx
		loop = V.Loop
	}
	if kbd.Keys&input.KeyDown != 0 {
		this.engine.Cam.Y += dx
		loop = V.Loop
	}
	const edgeZone = float32(64)
	for _, pointer := range frame.Input.Pointers[:frame.Input.PointersLen] {
		if pointer.Buttons == 0 {
			continue
		}
		if pointer.X < edgeZone {
			this.engine.Cam.X -= dx
			loop = V.Loop
		} else if pointer.X > float32(this.engine.CanvasW)-edgeZone {
			this.engine.Cam.X += dx
			loop = V.Loop
		}
		if pointer.Y < edgeZone {
			this.engine.Cam.Y -= dx
			loop = V.Loop
		} else if pointer.Y > float32(this.engine.CanvasH)-edgeZone {
			this.engine.Cam.Y += dx
			loop = V.Loop
		}
	}
	return loop
}

func (this *Game) CamX() float32 { return this.engine.CamX() }
func (this *Game) CamY() float32 { return this.engine.CamY() }

func (this *Game) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&demo.InitLevel.Tiles[0]))
}

func (this *Game) TileCount() uint32 {
	return uint32(len(demo.InitLevel.Tiles))
}

func (this *Game) LevelX() int16     { return demo.InitLevel.X }
func (this *Game) LevelY() int16     { return demo.InitLevel.Y }
func (this *Game) LevelW() uint16    { return demo.InitLevel.W }
func (this *Game) LevelH() uint16    { return demo.InitLevel.H }
func (this *Game) LevelTileW() uint8 { return demo.InitLevel.Tile.W }
func (this *Game) LevelTileH() uint8 { return demo.InitLevel.Tile.H }

func init() {
	println(version)
}
