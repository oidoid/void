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

func (this *Game) GetUpdatePointer() uintptr {
	return this.engine.GetUpdatePointer()
}

func (this *Game) GetSpritePointer() uintptr {
	return this.engine.GetSpritePointer()
}

func (this *Game) GetSpriteCount() uint32 {
	return this.engine.GetSpriteCount()
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

func (this *Game) GetCamX() float32 { return this.engine.GetCamX() }
func (this *Game) GetCamY() float32 { return this.engine.GetCamY() }

func (this *Game) GetTilePointer() uintptr {
	return uintptr(unsafe.Pointer(&demo.InitLevel.Tiles[0]))
}

func (this *Game) GetTileCount() uint32 {
	return uint32(len(demo.InitLevel.Tiles))
}

func (this *Game) GetLevelX() int16     { return demo.InitLevel.X }
func (this *Game) GetLevelY() int16     { return demo.InitLevel.Y }
func (this *Game) GetLevelW() uint16    { return demo.InitLevel.W }
func (this *Game) GetLevelH() uint16    { return demo.InitLevel.H }
func (this *Game) GetLevelTileW() uint8 { return demo.InitLevel.Tile.W }
func (this *Game) GetLevelTileH() uint8 { return demo.InitLevel.Tile.H }

func init() {
	println(version)
}
