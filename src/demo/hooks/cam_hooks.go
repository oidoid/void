package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
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
	var camX, camY float32
	if in.IsOn(vinput.ButtonL) {
		camX -= dx
	}
	if in.IsOn(vinput.ButtonR) {
		camX += dx
	}
	if in.IsOn(vinput.ButtonU) {
		camY -= dx
	}
	if in.IsOn(vinput.ButtonD) {
		camY += dx
	}
	const edgeZone = float32(64)
	if in.Ptr.Clicks() != 0 {
		xy := in.Ptr.Phy()
		if xy.Min.X < edgeZone {
			camX -= dx
		} else if xy.Min.X > float32(gam.CanvasPhy().W)-edgeZone {
			camX += dx
		}
		if xy.Min.Y < edgeZone {
			camY -= dx
		} else if xy.Min.Y > float32(gam.CanvasPhy().H)-edgeZone {
			camY += dx
		}
	}
	if camX == 0 && camY == 0 {
		return vgame.Pause
	}
	gam.Cam().X += camX
	gam.Cam().Y += camY
	return vgame.Loop
}

func UpdateLayers(gam *engine.Engine) vgame.Status {
	canvas := gam.CanvasPhy()
	scale := uint16(1)
	if canvas.W != 0 && canvas.H != 0 {
		scale = canvas.W / gfx.LevelClipWPhy
		if hScale := canvas.H / gfx.LevelClipHPhy; hScale < scale {
			scale = hScale
		}
		if scale == 0 {
			scale = 1
		}
	} // to-do: move to vgfx?
	clipW := gfx.LevelClipWPhy * scale
	clipH := gfx.LevelClipHPhy * scale
	clipPhy := vgeo.XYWH(
		centerClipOffset(canvas.W, clipW),
		centerClipOffset(canvas.H, clipH),
		clipW,
		clipH,
	)
	gam.Layer(gfx.LayerTiles).ClipPhy = clipPhy
	gam.Layer(gfx.LayerTiles).Modulo = uint8(scale)
	gam.Layer(gfx.LayerSuperballs).ClipPhy = clipPhy
	gam.Layer(gfx.LayerSuperballs).Modulo = uint8(scale)
	gam.Layer(gfx.LayerCursor).Modulo = uint8(scale)
	return vgame.Pause
}

func centerClipOffset(canvas, clip uint16) uint16 {
	if canvas <= clip {
		return 0
	}
	return (canvas - clip) / 2
}
