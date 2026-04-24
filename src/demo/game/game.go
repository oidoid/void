package game

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vweb"
)

type Game struct {
	engine *vengine.Engine
	balls  *vents.Zoo
}

var version string

func NewGame() Game {
	return Game{engine: vengine.NewEngine(), balls: &vents.Zoo{}}
}

var _ vweb.WasmAPI = (*Game)(nil)

func (this *Game) FramePointer() uintptr {
	return this.engine.FramePointer()
}

func (this *Game) SpritePointer() uintptr {
	return this.balls.SpritePointer()
}

func (this *Game) SpriteCount() int {
	return this.balls.SpriteCount()
}

func (this *Game) Update() vengine.LoopState {
	frame := this.engine.Frame
	this.balls.Update(frame)
	loop := vengine.Pause
	if this.balls.SpriteCount() > 0 {
		loop = vengine.Loop
	}
	// to-do: ball bounds level sized.
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons&1 == 1 {
			for range 1000 {
				if ball := ents.NewBallEnt(this.balls, &this.engine.Rnd, pointer.X, pointer.Y); ball != nil {
					this.balls.Add(ball)
				}
			}
			println(this.balls.SpriteCount(), "balls")
			loop = vengine.Loop
		}
	}
	if frame.Input.Wheel.DeltaX != 0 || frame.Input.Wheel.DeltaY != 0 || frame.Input.Wheel.DeltaZ != 0 {
		println("wheel", frame.Input.Wheel.DeltaX, frame.Input.Wheel.DeltaY, frame.Input.Wheel.DeltaZ)
	}
	for i := range frame.Input.GamepadsLen {
		gamepad := &frame.Input.Gamepads[i]
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = vengine.Loop
		}
	}
	kbd := &frame.Input.Keyboard
	const camSpeed = float32(1) // px/ms = 100 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if kbd.Keys&vinput.KeyC != 0 {
		dx *= 10
	}
	if kbd.Keys&vinput.KeyLeft != 0 {
		this.engine.Cam.X -= dx
		loop = vengine.Loop
	}
	if kbd.Keys&vinput.KeyRight != 0 {
		this.engine.Cam.X += dx
		loop = vengine.Loop
	}
	if kbd.Keys&vinput.KeyUp != 0 {
		this.engine.Cam.Y -= dx
		loop = vengine.Loop
	}
	if kbd.Keys&vinput.KeyDown != 0 {
		this.engine.Cam.Y += dx
		loop = vengine.Loop
	}
	const edgeZone = float32(64)
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons == 0 {
			continue
		}
		if pointer.X < edgeZone {
			this.engine.Cam.X -= dx
			loop = vengine.Loop
		} else if pointer.X > float32(frame.CanvasW)-edgeZone {
			this.engine.Cam.X += dx
			loop = vengine.Loop
		}
		if pointer.Y < edgeZone {
			this.engine.Cam.Y -= dx
			loop = vengine.Loop
		} else if pointer.Y > float32(frame.CanvasH)-edgeZone {
			this.engine.Cam.Y += dx
			loop = vengine.Loop
		}
	}
	for bit := vinput.Key(1); bit != 0; bit <<= 1 {
		if kbd.Keys&bit != 0 {
			println("key", bit)
			loop = vengine.Loop
		}
	}
	if kbd.TextLen > 0 {
		text := string(kbd.Text[:kbd.TextLen])
		println("text", text)
		if kbd.TextOverflow {
			println("error: text overflow")
		}
		loop = vengine.Loop
	}
	return loop
}

func (this *Game) CamX() float32 { return this.engine.CamX() }
func (this *Game) CamY() float32 { return this.engine.CamY() }

func (this *Game) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&levels.InitLevel.Tiles[0]))
}

func (this *Game) TileCount() uint32 {
	return uint32(len(levels.InitLevel.Tiles))
}

func (this *Game) LevelX() int16     { return levels.InitLevel.X }
func (this *Game) LevelY() int16     { return levels.InitLevel.Y }
func (this *Game) LevelW() uint16    { return levels.InitLevel.W }
func (this *Game) LevelH() uint16    { return levels.InitLevel.H }
func (this *Game) LevelTileW() uint8 { return levels.InitLevel.Tile.W }
func (this *Game) LevelTileH() uint8 { return levels.InitLevel.Tile.H }

func init() {
	println(version)
}
