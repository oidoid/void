package game

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vweb"
)

type Game struct {
	*vgame.Engine
	balls *vents.Zoo[*Game]
}

var _ vweb.WasmAPI = (*Game)(nil)
var version string

func NewGame() Game {
	game := Game{Engine: vgame.NewEngine(), balls: &vents.Zoo[*Game]{}}
	game.Level = &levels.InitLevel
	return game
}

func (this *Game) SpritePointer() uintptr {
	return this.balls.SpritePointer()
}

func (this *Game) SpriteCount() int {
	return this.balls.SpriteCount()
}

// to-do: move all this to init_level.go.
func (this *Game) Update() vgame.LoopState {
	frame := this.Frame()
	this.balls.Update(this)
	loop := vgame.Pause
	if this.balls.SpriteCount() > 0 {
		loop = vgame.Loop
	}
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons&1 == 1 {
			for range int(10_000 * (frame.DeltaMs / 1000)) {
				if ball := ents.NewBallEnt(this.balls, this.Rnd, pointer.X, pointer.Y); ball != nil {
					this.balls.Add(ball)
				}
			}
			println(this.balls.SpriteCount(), "balls", int(pointer.X), int(pointer.Y), int(frame.DeltaMs))
			loop = vgame.Loop
		}
	}
	if frame.Input.Wheel.DeltaX != 0 || frame.Input.Wheel.DeltaY != 0 || frame.Input.Wheel.DeltaZ != 0 {
		println("wheel", frame.Input.Wheel.DeltaX, frame.Input.Wheel.DeltaY, frame.Input.Wheel.DeltaZ)
	}
	for i := range frame.Input.GamepadsLen {
		gamepad := &frame.Input.Gamepads[i]
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = vgame.Loop
		}
	}
	kbd := &frame.Input.Keyboard
	const camSpeed = float32(1) // px/ms = 100 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if kbd.Keys&vinput.KeyC != 0 {
		dx *= 10
	}
	if kbd.Keys&vinput.KeyLeft != 0 {
		this.Cam.X -= dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyRight != 0 {
		this.Cam.X += dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyUp != 0 {
		this.Cam.Y -= dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyDown != 0 {
		this.Cam.Y += dx
		loop = vgame.Loop
	}
	const edgeZone = float32(64)
	for i := range frame.Input.PointersLen {
		pointer := &frame.Input.Pointers[i]
		if pointer.Buttons == 0 {
			continue
		}
		if pointer.X < edgeZone {
			this.Cam.X -= dx
			loop = vgame.Loop
		} else if pointer.X > float32(frame.CanvasW)-edgeZone {
			this.Cam.X += dx
			loop = vgame.Loop
		}
		if pointer.Y < edgeZone {
			this.Cam.Y -= dx
			loop = vgame.Loop
		} else if pointer.Y > float32(frame.CanvasH)-edgeZone {
			this.Cam.Y += dx
			loop = vgame.Loop
		}
	}
	for bit := vinput.Key(1); bit != 0; bit <<= 1 {
		if kbd.Keys&bit != 0 {
			println("key", bit)
			loop = vgame.Loop
		}
	}
	if kbd.TextLen > 0 {
		text := string(kbd.Text[:kbd.TextLen])
		println("text", text)
		if kbd.TextOverflow {
			println("error: text overflow")
		}
		loop = vgame.Loop
	}
	return loop
}

func (this *Game) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&levels.InitLevel.Tiles[0]))
}

func (this *Game) TileCount() uint32 {
	return uint32(len(levels.InitLevel.Tiles))
}

func (this *Game) LevelTileW() uint8 { return levels.InitLevel.Tile.W }
func (this *Game) LevelTileH() uint8 { return levels.InitLevel.Tile.H }

func init() {
	println(version)
}
