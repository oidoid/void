package venthooks

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
)

func DebugInput[Game vgame.Game](gam Game) vgame.Status {
	loop := vgame.Pause
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
	kbd := &gam.Input().Keyboard
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
