package levels

import (
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
)

func Update(gam game.Game) vgame.Status {
	frame := gam.Frame()
	gam.Balls().Update(gam)
	loop := vgame.Pause
	if gam.SpriteCount() > 0 {
		loop = vgame.Loop
	}
	for i := range gam.Input().PointersLen {
		pointer := &gam.Input().Pointers[i]
		if pointer.Buttons&1 == 1 {
			for range int(20_000 * (frame.DeltaMs / 1000)) {
				gam.Balls().Add(ents.NewBallEnt(gam, pointer.X, pointer.Y))
			}
			println(gam.SpriteCount(), "balls", int(pointer.X), int(pointer.Y), int(frame.DeltaMs))
			loop = vgame.Loop
		}
	}
	println(gam.Canvas().W, gam.Canvas().H)
	if gam.Input().Wheel.Delta.X != 0 || gam.Input().Wheel.Delta.Y != 0 || gam.Input().Wheel.Delta.Z != 0 {
		println("wheel", gam.Input().Wheel.Delta.X, gam.Input().Wheel.Delta.Y, gam.Input().Wheel.Delta.Z)
	}
	for i := range gam.Input().GamepadsLen {
		gamepad := &gam.Input().Gamepads[i]
		println("gamepad", gamepad.Index, gamepad.Buttons, gamepad.Axes[0], gamepad.Axes[1])
		if gamepad.Buttons != 0 {
			loop = vgame.Loop
		}
	}
	kbd := gam.Input().Keyboard
	const camSpeed = float32(1) // px/ms = 100 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if kbd.Keys&vinput.KeyC != 0 {
		dx *= 10
	}
	if kbd.Keys&vinput.KeyLeft != 0 {
		gam.Cam().X -= dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyRight != 0 {
		gam.Cam().X += dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyUp != 0 {
		gam.Cam().Y -= dx
		loop = vgame.Loop
	}
	if kbd.Keys&vinput.KeyDown != 0 {
		gam.Cam().Y += dx
		loop = vgame.Loop
	}
	const edgeZone = float32(64)
	for i := range gam.Input().PointersLen {
		pointer := &gam.Input().Pointers[i]
		if pointer.Buttons == 0 {
			continue
		}
		if pointer.X < edgeZone {
			gam.Cam().X -= dx
			loop = vgame.Loop
		} else if pointer.X > float32(gam.Canvas().W)-edgeZone {
			gam.Cam().X += dx
			loop = vgame.Loop
		}
		if pointer.Y < edgeZone {
			gam.Cam().Y -= dx
			loop = vgame.Loop
		} else if pointer.Y > float32(gam.Canvas().H)-edgeZone {
			gam.Cam().Y += dx
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
