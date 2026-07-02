package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
)

func UpdateCam(gam *engine.Engine) vgame.Status {
	frame := gam.Frame()
	in := gam.In()
	const camSpeed = .1 // px/ms = 10 px/s
	dx := camSpeed * float32(frame.DeltaMs)
	if in.IsOn(vinput.ButtonC) {
		dx *= 10
	}
	stat := vgame.Pause
	if in.IsOn(vinput.ButtonL) {
		gam.Cam().X -= dx
		stat = vgame.Loop
	}
	if in.IsOn(vinput.ButtonR) {
		gam.Cam().X += dx
		stat = vgame.Loop
	}
	if in.IsOn(vinput.ButtonU) {
		gam.Cam().Y -= dx
		stat = vgame.Loop
	}
	if in.IsOn(vinput.ButtonD) {
		gam.Cam().Y += dx
		stat = vgame.Loop
	}
	const edgeZone = float32(64)
	if in.Ptr.Clicks() != 0 {
		xy := in.Ptr.Phy()
		if xy.Min.X < edgeZone {
			gam.Cam().X -= dx
			stat = vgame.Loop
		} else if xy.Min.X > float32(gam.CanvasPhy().W)-edgeZone {
			gam.Cam().X += dx
			stat = vgame.Loop
		}
		if xy.Min.Y < edgeZone {
			gam.Cam().Y -= dx
			stat = vgame.Loop
		} else if xy.Min.Y > float32(gam.CanvasPhy().H)-edgeZone {
			gam.Cam().Y += dx
			stat = vgame.Loop
		}
	}
	return stat
}
