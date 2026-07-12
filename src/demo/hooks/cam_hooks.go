package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"

	"github.com/oidoid/void/src/void/vin"
)

func UpdateCam(gam *engine.Engine) vgame.Status {
	frame := gam.Frame()
	in := gam.In()
	d := .1 * float32(frame.DeltaMs) // phy px/ms = 100 px/s
	if in.IsOn(vin.ButtonC) {
		d *= 10
	}
	by := vgeo.XY[float32]{X: float32(in.Dir.X) * d, Y: float32(in.Dir.Y) * d}
	const edgeZone = float32(64)
	if in.Ptr.Clicks() != 0 {
		xy := in.Ptr.Phy()
		if xy.Min.X < edgeZone {
			by.X -= d
		} else if xy.Min.X > float32(gam.CanvasPhy().W)-edgeZone {
			by.X += d
		}
		if xy.Min.Y < edgeZone {
			by.Y -= d
		} else if xy.Min.Y > float32(gam.CanvasPhy().H)-edgeZone {
			by.Y += d
		}
	}
	if by == (vgeo.XY[float32]{}) {
		return vgame.Pause
	}
	cam := gam.Cam()
	if in.IsAnyStart(vin.ButtonL | vin.ButtonR | vin.ButtonU | vin.ButtonD) {
		tiles := gam.Layer(gfx.LayerTiles)
		xy := tiles.PhyToLayerScale(*cam)
		xy = vgfx.DiagonalizeXY(xy, by)
		*cam = tiles.LayerToPhyScale(xy)
	}
	cam.AddTo(by)
	return vgame.Loop
}

func UpdateLayers(gam *engine.Engine) vgame.Status {
	canvas := gam.CanvasPhy()
	scale := levelScale(canvas)
	clipW := gfx.LevelClipWPhy * scale
	clipH := gfx.LevelClipHPhy * scale
	// snap offset to UI scale multiples so the level border and hud widgets
	// move in the same increments and never drift apart by a physical pixel.
	uiScale := uint16(gam.Layer(gfx.LayerUI).ScaleOrDefault())
	clipPhy := vgeo.XYWH(
		snapOffset(centerClipOffset(canvas.W, clipW), uiScale),
		snapOffset(centerClipOffset(canvas.H, clipH), uiScale),
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

func snapOffset(offset, scale uint16) uint16 {
	if scale == 0 {
		return offset
	}
	return (offset / scale) * scale
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
