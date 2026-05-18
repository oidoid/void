package enthooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
)

func UpdateCam(gam *engine.Engine) vgame.Status {
	frame := gam.Frame()
	kbd := &gam.Input().Keyboard
	const camSpeed = .1 // px/ms = 10 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if kbd.Keys&vinput.KeyC != 0 {
		dx *= 10
	}
	loop := vgame.Pause
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
		if pointer.Min.X < edgeZone {
			gam.Cam().X -= dx
			loop = vgame.Loop
		} else if pointer.Min.X > float32(gam.Canvas().W)-edgeZone {
			gam.Cam().X += dx
			loop = vgame.Loop
		}
		if pointer.Min.Y < edgeZone {
			gam.Cam().Y -= dx
			loop = vgame.Loop
		} else if pointer.Min.Y > float32(gam.Canvas().H)-edgeZone {
			gam.Cam().Y += dx
			loop = vgame.Loop
		}
	}
	return loop
}
