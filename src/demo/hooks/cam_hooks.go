package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"

	"github.com/oidoid/void/src/void/vin"
)

// to-do: update cam last and check click mask state.
func UpdateCam(gam *engine.Engine) vgame.Status {
	frame := gam.Frame()
	in := gam.In()
	d := .1 * float32(frame.DeltaMillis) // phy px/ms = 100 px/s
	if in.IsOn(vin.ButtonC) {
		d *= 10
	}
	by := vgeo.NewXY(float32(in.Dir.X)*d, float32(in.Dir.Y)*d)
	const edgeZone = float32(64)
	if in.Ptr.Clicks() != 0 {
		ptr := in.Ptr.CenterPhy()
		if ptr.X < edgeZone {
			by.X -= d
		} else if ptr.X > float32(gam.CanvasPhy().W)-edgeZone {
			by.X += d
		}
		if ptr.Y < edgeZone {
			by.Y -= d
		} else if ptr.Y > float32(gam.CanvasPhy().H)-edgeZone {
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
	canvasPhy := *gam.CanvasPhy()
	scale := levelScale(canvasPhy)
	clipW := gfx.LevelClipWPhy * scale
	clipH := gfx.LevelClipHPhy * scale
	lvlClipPhy := vgeo.XYWH(
		centerOffset(canvasPhy.W, clipW),
		centerOffset(canvasPhy.H, clipH),
		clipW,
		clipH,
	)
	gam.Layer(gfx.LayerTiles).ClipPhy = lvlClipPhy
	gam.Layer(gfx.LayerP1).ClipPhy = lvlClipPhy
	gam.Layer(gfx.LayerSuperballs).ClipPhy = lvlClipPhy
	return vgame.Pause
}

// the level frame in UI pixels.
func lvlEdge(
	clipPhy vgeo.Box[uint16],
	canvasPhy vgeo.WH[uint16],
	ui *vgfx.LayerConfig,
) vgeo.Box[float32] {
	uiWH := ui.PhyToLayerWHInt(canvasPhy)
	x := vgfx.PhyToClipStartPx(clipPhy.Min.X, canvasPhy.W, uiWH.W)
	y := vgfx.PhyToClipStartPx(clipPhy.Min.Y, canvasPhy.H, uiWH.H)
	r := vgfx.PhyToClipEndPx(clipPhy.Max.X, canvasPhy.W, uiWH.W)
	b := vgfx.PhyToClipEndPx(clipPhy.Max.Y, canvasPhy.H, uiWH.H)
	return vgeo.NewBox(float32(x), float32(y), float32(r), float32(b))
}

func centerOffset(canvas, clip uint16) uint16 {
	if canvas <= clip {
		return 0
	}
	return (canvas - clip) / 2
}

// to-do: move to vgfx or vcam?
// to-do: more consistency in phy vs layer coords.
func levelScale(canvasPhy vgeo.WH[uint16]) uint16 {
	scale := canvasPhy.W / gfx.LevelClipWPhy
	if hScale := canvasPhy.H / gfx.LevelClipHPhy; hScale < scale {
		scale = hScale
	}
	if scale == 0 {
		return 1
	}
	return scale
}
