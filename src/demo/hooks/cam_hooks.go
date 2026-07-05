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
	var delta vgeo.XY[float32]
	if in.IsOn(vinput.ButtonL) {
		delta.X -= dx
	}
	if in.IsOn(vinput.ButtonR) {
		delta.X += dx
	}
	if in.IsOn(vinput.ButtonU) {
		delta.Y -= dx
	}
	if in.IsOn(vinput.ButtonD) {
		delta.Y += dx
	}
	const edgeZone = float32(64)
	if in.Ptr.Clicks() != 0 {
		xy := in.Ptr.Phy()
		if xy.Min.X < edgeZone {
			delta.X -= dx
		} else if xy.Min.X > float32(gam.CanvasPhy().W)-edgeZone {
			delta.X += dx
		}
		if xy.Min.Y < edgeZone {
			delta.Y -= dx
		} else if xy.Min.Y > float32(gam.CanvasPhy().H)-edgeZone {
			delta.Y += dx
		}
	}
	if delta == (vgeo.XY[float32]{}) {
		return vgame.Pause
	}
	gam.Cam().AddTo(delta)
	return vgame.Loop
}

func UpdateLayers(gam *engine.Engine) vgame.Status {
	canvas := gam.CanvasPhy()
	scale := levelScale(canvas)
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

// to-do: move to vgfx?
// to-do: more consistency in phy vs layer coords.
func levelScale(canvas *vgeo.WH[uint16]) uint16 {
	if canvas.W == 0 || canvas.H == 0 {
		return 1
	}
	scale := canvas.W / gfx.LevelClipWPhy
	if hScale := canvas.H / gfx.LevelClipHPhy; hScale < scale {
		scale = hScale
	}
	if scale == 0 {
		return 1
	}
	return scale
}
