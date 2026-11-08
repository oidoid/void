package game

import (
	"math"

	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"

	"github.com/oidoid/void/src/void/vin"
)

const camKeyVel = float32(10) // lvl px / sec.

// pans and zooms the lvl cam from pointer, wheel, pinch, and key input.
type CamHooks struct {
	// accumulates keyboard movement in lvl coords.
	key vgeo.XY[float32]
	// phy point held fixed on screen while zooming.
	zoomAnchorPhy vgeo.XY[float32]
	panOn         bool
	zoomOn        bool
}

// to-do: update cam last and check click mask state.
func (this *CamHooks) Update(gam *Game) veng.Status {
	in := gam.In()
	stat := veng.Pause
	anchor := zoomAnchor(gam)
	cursor := gam.Cursor()
	dirOn := in.DirOn && (cursor == nil || !cursor.KbdEnabled)
	pinch := in.Pinch
	ptr := in.Ptr
	tiles := gam.Layer(gfx.LayerTiles)
	dragOn := lvlDragOn(ptr, tiles.ClipPhy)
	panOn := pinch != nil || dragOn
	panEnd := this.panOn && !panOn
	this.panOn = panOn
	wheelZoomOn := in.Wheel.Delta.Y != 0
	zoomOn := pinch != nil || wheelZoomOn
	zoomEnd := this.zoomOn && !zoomOn
	this.zoomOn = zoomOn
	if pinch != nil {
		this.zoomAnchorPhy = pinch.CenterPhy
	} else if wheelZoomOn {
		this.zoomAnchorPhy = anchor
	}
	lvlScaleChanged := false
	if pinch != nil &&
		gam.ZoomLvlAt(pinch.CenterPhy, pinchZoom(pinch)) {
		stat |= veng.Loop
		lvlScaleChanged = true
	}
	if wheelZoomOn &&
		gam.ZoomLvlAt(anchor, wheelZoom(in.Wheel.Delta.Y)) {
		stat |= veng.Loop
		lvlScaleChanged = true
	}
	if zoomEnd && snapLvlScaleAt(gam, this.zoomAnchorPhy) {
		stat |= veng.Loop
		lvlScaleChanged = true
	}
	if in.IsOnStart(vin.ButtonScaleReset) {
		in.Mask |= vin.ButtonScaleReset
		if gam.ResetLvlScaleAt(anchor) {
			stat |= veng.Loop
			lvlScaleChanged = true
		}
	}
	if in.IsOnStart(vin.ButtonScaleDec) {
		in.Mask |= vin.ButtonScaleDec
		if adjustLvlScaleAtKey(gam, anchor, -keyZoomDelta) {
			stat |= veng.Loop
			lvlScaleChanged = true
		}
	}
	if in.IsOnStart(vin.ButtonScaleInc) {
		in.Mask |= vin.ButtonScaleInc
		if adjustLvlScaleAtKey(gam, anchor, keyZoomDelta) {
			stat |= veng.Loop
			lvlScaleChanged = true
		}
	}
	d := camKeyVel * float32(gam.DeltaSecs())
	if dirOn && in.IsOn(vin.ButtonC) {
		in.Mask |= vin.ButtonC
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
	by = tiles.PhyToLayerScale(by)
	cam := gam.Cam()
	if dirOn {
		keyStart := in.PrevDir == (vgeo.XY[int8]{}) || lvlScaleChanged
		snapXY := cam
		key := &this.key
		if keyStart {
			// resume from the current snapped camera after a key or pan break.
			snapXY = vgeo.RoundXY(cam)
			*key = snapXY
		} else {
			// retain fractional progress only on axes whose direction is unchanged.
			if in.PrevDir.X != in.Dir.X {
				key.X = snapXY.X
			}
			if in.PrevDir.Y != in.Dir.Y {
				key.Y = snapXY.Y
			}
		}
		key.AddTo(keyBy)
		cam = vgfx.SnapMove(*key, snapXY, keyBy)
	}
	if by == (vgeo.XY[float32]{}) && !dirOn {
		if panEnd {
			snapCam(gam)
			return stat | veng.Loop
		}
		return stat
	}
	gam.SetCam(cam.Add(by))
	if panEnd {
		snapCam(gam)
	}
	if dirOn && (by != (vgeo.XY[float32]{}) || panEnd) {
		this.key = gam.Cam()
	}
	return stat | veng.Loop
}

func adjustLvlScaleAtKey(
	gam *Game,
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
	gam *Game,
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
func lvlDragOn(ptr *vin.Ptr, clipPhy vgeo.Box[uint16]) bool {
	if ptr == nil || !ptr.Drag.On {
		return false
	}
	if clipPhy.W() == 0 || clipPhy.H() == 0 {
		return true
	}
	clip := clipPhy.Cast[float32]()
	return clip.HitsXY(ptr.Drag.StartPhy)
}

func snapCam(gam *Game) {
	gam.SetCam(vgeo.RoundXY(gam.Cam()))
}

func UpdateLayers(gam *Game) veng.Status {
	gam.UpdateLvlLayers()
	return veng.Pause
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

func zoomAnchor(gam *Game) vgeo.XY[float32] {
	if ptr := gam.In().Ptr.CenterPhy(); ptr != nil {
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
