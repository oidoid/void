package hooks

import (
	"math"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"

	"github.com/oidoid/void/src/void/vin"
)

const camKeyVel = float32(10) // lvl px / sec.

// to-do: update cam last and check click mask state.
func UpdateCam(gam *engine.Engine) vgame.Status {
	in := gam.In()
	stat := vgame.Pause
	anchor := zoomAnchor(gam, in)
	dirOn := in.DirOn && (gam.Cursor == nil || !gam.Cursor.KbdEnabled)
	pinch := in.Pinch
	ptr := in.Ptr
	panOn := pinch != nil || ptr != nil && ptr.Drag.On
	panEnd := gam.CamPanOn && !panOn
	gam.CamPanOn = panOn
	lvlScaleChanged := false
	if pinch != nil &&
		gam.ZoomLvlAt(pinch.CenterPhy, pinchZoom(pinch)) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.Wheel.Delta.Y != 0 &&
		gam.ZoomLvlAt(anchor, wheelZoom(in.Wheel.Delta.Y)) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleReset) &&
		gam.ResetLvlScaleAt(anchor) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleDec) &&
		gam.AdjustLvlScaleAt(anchor, -keyZoomDelta) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleInc) &&
		gam.AdjustLvlScaleAt(anchor, keyZoomDelta) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	tiles := gam.Layer(gfx.LayerTiles)
	d := camKeyVel * float32(gam.DeltaSecs()) * tiles.ScaleOrDefault()
	if in.IsOn(vin.ButtonC) {
		d *= 10
	}
	keyBy := vgeo.NewXY(float32(in.Dir.X)*d, float32(in.Dir.Y)*d)
	by := vgeo.XY[float32]{}
	if pinch != nil {
		by.X -= pinch.DeltaCenterPhy.X
		by.Y -= pinch.DeltaCenterPhy.Y
	} else if ptr != nil && ptr.Drag.On {
		by.X -= ptr.Drag.DeltaPhy.X
		by.Y -= ptr.Drag.DeltaPhy.Y
	}
	cam := gam.Cam()
	if dirOn {
		keyStart := in.PrevDir == (vgeo.XY[int8]{}) || lvlScaleChanged
		snapXY := tiles.PhyToLayerScale(*cam)
		if keyStart {
			// resume from the current snapped camera after a key or pan break.
			gam.CamKeyPhy = *cam
			snapXY = vgfx.SnapXY(snapXY, keyBy)
			gam.CamKeyPhy = tiles.LayerToPhyScale(snapXY)
		}
		keyPhy := &gam.CamKeyPhy
		if !keyStart {
			// retain fractional progress only on axes whose direction is unchanged.
			keyXY := tiles.PhyToLayerScale(*keyPhy)
			if in.PrevDir.X != in.Dir.X {
				keyXY.X = snapXY.X
			}
			if in.PrevDir.Y != in.Dir.Y {
				keyXY.Y = snapXY.Y
			}
			*keyPhy = tiles.LayerToPhyScale(keyXY)
		}
		keyPhy.AddTo(keyBy)
		keyXY := tiles.PhyToLayerScale(*keyPhy)
		*cam = tiles.LayerToPhyScale(
			vgfx.SnapMove(keyXY, snapXY, keyBy),
		)
	}
	if by == (vgeo.XY[float32]{}) && !dirOn {
		if panEnd {
			snapCam(gam, vgeo.XY[float32]{})
			return stat | vgame.Loop
		}
		return stat
	}
	cam.AddTo(by)
	if panEnd {
		snapCam(gam, vgeo.XY[float32]{})
	}
	if dirOn && (by != (vgeo.XY[float32]{}) || panEnd) {
		gam.CamKeyPhy = *cam
	}
	return stat | vgame.Loop
}

func snapCam(gam *engine.Engine, by vgeo.XY[float32]) {
	cam := gam.Cam()
	tiles := gam.Layer(gfx.LayerTiles)
	xy := tiles.PhyToLayerScale(*cam)
	xy = vgfx.SnapXY(xy, by)
	*cam = tiles.LayerToPhyScale(xy)
}

func UpdateLayers(gam *engine.Engine) vgame.Status {
	gam.UpdateLvlLayers()
	return vgame.Pause
}

func pinchZoom(pinch *vin.Pinch) float32 {
	prev := vgeo.NewXY(
		pinch.SpanPhy.X-pinch.DeltaPhy.X,
		pinch.SpanPhy.Y-pinch.DeltaPhy.Y,
	)
	prevDistance := float32(math.Hypot(float64(prev.X), float64(prev.Y)))
	if prevDistance == 0 {
		return 1
	}
	distance := float32(math.Hypot(
		float64(pinch.SpanPhy.X),
		float64(pinch.SpanPhy.Y),
	))
	return distance / prevDistance
}

func wheelZoom(delta float32) float32 {
	const notch = float32(100)
	steps := delta / notch
	if steps < 0 {
		return 1 - steps*wheelZoomDelta
	}
	return 1 / (1 + steps*wheelZoomDelta)
}

const (
	keyZoomDelta   = float32(.25)
	wheelZoomDelta = float32(.25)
)

func zoomAnchor(gam *engine.Engine, in *vin.In) vgeo.XY[float32] {
	if ptr := in.Ptr.CenterPhy(); ptr != nil {
		return *ptr
	}
	canvasPhy := gam.CanvasPhy()
	return vgeo.NewXY(float32(canvasPhy.W)/2, float32(canvasPhy.H)/2)
}

// the lvl frame in UI pixels.
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
