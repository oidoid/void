package hooks

import (
	"math"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"

	"github.com/oidoid/void/src/void/vin"
)

const camKeyVel = float32(10) // lvl px / sec.

// to-do: update cam last and check click mask state.
func UpdateCam(gam *engine.Eng) vgame.Status {
	in := gam.In()
	stat := vgame.Pause
	anchor := zoomAnchor(gam, in)
	dirOn := in.DirOn && (gam.Cursor == nil || !gam.Cursor.KbdEnabled)
	pinch := in.Pinch
	ptr := in.Ptr
	tiles := gam.Layer(gfx.LayerTiles)
	dragOn := lvlDragOn(ptr, tiles.ClipPhy)
	panOn := pinch != nil || dragOn
	panEnd := gam.CamPanOn && !panOn
	gam.CamPanOn = panOn
	wheelZoomOn := in.Wheel.Delta.Y != 0
	zoomOn := pinch != nil || wheelZoomOn
	zoomEnd := gam.CamZoomOn && !zoomOn
	gam.CamZoomOn = zoomOn
	if pinch != nil {
		gam.CamZoomAnchorPhy = pinch.CenterPhy
	} else if wheelZoomOn {
		gam.CamZoomAnchorPhy = anchor
	}
	lvlScaleChanged := false
	if pinch != nil &&
		gam.ZoomLvlAt(pinch.CenterPhy, pinchZoom(pinch)) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if wheelZoomOn &&
		gam.ZoomLvlAt(anchor, wheelZoom(in.Wheel.Delta.Y)) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if zoomEnd && snapLvlScaleAt(gam, gam.CamZoomAnchorPhy) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleReset) && gam.ResetLvlScaleAt(anchor) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleDec) &&
		adjustLvlScaleAtKey(gam, anchor, -keyZoomDelta) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleInc) &&
		adjustLvlScaleAtKey(gam, anchor, keyZoomDelta) {
		stat |= vgame.Loop
		lvlScaleChanged = true
	}
	d := camKeyVel * float32(gam.DeltaSecs()) * tiles.ScaleOrDefault()
	if in.IsOn(vin.ButtonC) {
		d *= 10
	}
	keyBy := vgeo.NewXY(float32(in.Dir.X)*d, float32(in.Dir.Y)*d)
	by := vgeo.XY[float32]{}
	if pinch != nil {
		by.X -= pinch.DeltaCenterPhy.X
		by.Y -= pinch.DeltaCenterPhy.Y
	} else if dragOn {
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

func adjustLvlScaleAtKey(
	gam *engine.Eng,
	anchor vgeo.XY[float32],
	by float32,
) bool {
	scale := gam.Layer(gfx.LayerTiles).ScaleOrDefault()
	target := keyZoomTarget(scale, by)
	return gam.AdjustLvlScaleAt(anchor, target-scale)
}

func keyZoomTarget(scale, by float32) float32 {
	if by > 0 {
		return (vmath.Floor(scale/by) + 1) * by
	}
	step := -by
	return (vmath.Ceil(scale/step) - 1) * step
}

func snapLvlScaleAt(
	gam *engine.Eng,
	anchor vgeo.XY[float32],
) bool {
	const tolerance = float32(.1)
	scale := gam.Layer(gfx.LayerTiles).ScaleOrDefault()
	target := vmath.Round(scale)
	if v := scale - target; v < -tolerance || v > tolerance {
		return false
	}
	return gam.AdjustLvlScaleAt(anchor, target-scale)
}

// reports whether a drag began within the visible lvl clip.
func lvlDragOn(ptr *vin.Pointer, clipPhy vgeo.Box[uint16]) bool {
	if ptr == nil || !ptr.Drag.On {
		return false
	}
	if clipPhy.W() == 0 || clipPhy.H() == 0 {
		return true
	}
	clip := clipPhy.Cast[float32]()
	return clip.HitsXY(ptr.Drag.StartPhy)
}

func snapCam(gam *engine.Eng, by vgeo.XY[float32]) {
	cam := gam.Cam()
	tiles := gam.Layer(gfx.LayerTiles)
	xy := tiles.PhyToLayerScale(*cam)
	xy = vgfx.SnapXY(xy, by)
	*cam = tiles.LayerToPhyScale(xy)
}

func UpdateLayers(gam *engine.Eng) vgame.Status {
	gam.UpdateLvlLayers()
	return vgame.Pause
}

func pinchZoom(pinch *vin.Pinch) float32 {
	prev := pinch.SpanPhy.Sub(pinch.DeltaPhy)
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

func zoomAnchor(gam *engine.Eng, in *vin.In) vgeo.XY[float32] {
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
