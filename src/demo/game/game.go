package game

import (
	"unsafe"

	"github.com/oidoid/void/src/demo"
	"github.com/oidoid/void/src/demo/ents"
	V "github.com/oidoid/void/src/engine"
	"github.com/oidoid/void/src/engine/input"
)

type Game struct {
	engine   *V.Engine
	balls    *V.Zoo
	ballPool ents.BallPool
}

var version string

func NewGame() Game {
	return Game{engine: V.NewEngine(), balls: V.NewZoo()}
}

var _ V.WasmAPI = (*Game)(nil)

func (this *Game) FramePointer() uintptr {
	return this.engine.FramePointer()
}

func (this *Game) SpritePointer() uintptr {
	return this.balls.SpritePointer()
}

func (this *Game) SpriteCount() uint32 {
	return this.balls.SpriteCount()
}

func (this *Game) Update() V.LoopState {
	frame := this.engine.Frame()
	this.balls.Update(frame)
	loop := V.Pause
	if this.balls.SpriteCount() > 0 {
		loop = V.Loop
	}
	// to-do: ball bounds level sized.
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons&1 == 1 {
			for range 1000 {
				if b := this.ballPool.New(&this.engine.Rnd, pointer.X, pointer.Y); b != nil {
					this.balls.Add(b)
				}
			}
			println(this.balls.SpriteCount(), "balls")
			loop = V.Loop
		}
	}
	if frame.Input.Wheel.DeltaX != 0 || frame.Input.Wheel.DeltaY != 0 || frame.Input.Wheel.DeltaZ != 0 {
		println("wheel", frame.Input.Wheel.DeltaX, frame.Input.Wheel.DeltaY, frame.Input.Wheel.DeltaZ)
	}
	for i := range frame.Input.GamepadsLen {
		gamepad := &frame.Input.Gamepads[i]
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = V.Loop
		}
	}
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
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons == 0 {
			continue
		}
		if pointer.X < edgeZone {
			this.engine.Cam.X -= dx
			loop = V.Loop
		} else if pointer.X > float32(frame.CanvasW)-edgeZone {
			this.engine.Cam.X += dx
			loop = V.Loop
		}
		if pointer.Y < edgeZone {
			this.engine.Cam.Y -= dx
			loop = V.Loop
		} else if pointer.Y > float32(frame.CanvasH)-edgeZone {
			this.engine.Cam.Y += dx
			loop = V.Loop
		}
	}
	for bit := input.Key(1); bit != 0; bit <<= 1 {
		if kbd.Keys&bit != 0 {
			println("key", bit)
			loop = V.Loop
		}
	}
	if kbd.TextLen > 0 {
		text := string(kbd.Text[:kbd.TextLen])
		println("text", text)
		if kbd.TextOverflow {
			println("error: text overflow")
		}
		loop = V.Loop
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
