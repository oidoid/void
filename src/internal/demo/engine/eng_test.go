package engine

import (
	"math"
	"testing"

	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestWakelock(t *testing.T) {
	gam := New()
	if got := gam.ReqWakelockFlag(); got != 1 {
		t.Errorf("ReqWakelockFlag() = %v, want 1", got)
	}
	gam.DisableWakelock(true)
	if got := gam.ReqWakelockFlag(); got != 0 {
		t.Errorf("ReqWakelockFlag() = %v, want 0", got)
	}
	if gam.Wakelock() {
		t.Error("Wakelock() = true without browser confirmation")
	}
	gam.Poll().Wakelocked = true
	if !gam.Wakelock() {
		t.Error("Wakelock() = false, want true")
	}
}

// applies the zzz URL override before the demo submits its wakelock req.
func TestWakelockURLDisable(t *testing.T) {
	gam := New()
	gam.Router.Update = func(*Eng) vgame.Status { return vgame.Pause }
	gam.Poll().ReqWakelock = vgame.WakelockReqOff
	gam.Update()
	if !gam.WakelockDisabled() {
		t.Error("WakelockDisabled() = false, want true")
	}
	if got := gam.ReqWakelockFlag(); got != 0 {
		t.Errorf("ReqWakelockFlag() = %v, want 0", got)
	}
}

// applies the window URL override before the demo submits its fullscreen req.
func TestFullscreenURLDisable(t *testing.T) {
	gam := New()
	gam.Router.Update = func(*Eng) vgame.Status { return vgame.Pause }
	gam.Poll().FullscreenReq = vgame.FullscreenReqExit
	gam.Update()
	if gam.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := gam.FullscreenReq(); got != int32(vgame.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

// controls the persistent windowed setting directly.
func TestFullscreenToggle(t *testing.T) {
	gam := New()
	toggle := entities.NewFullscreenToggle(gam)
	toggle.OnUpdate(toggle)
	if toggle.On {
		t.Error("toggle.On = true, want false")
	}
	toggle.On = true
	toggle.OnClick(toggle)
	if gam.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := gam.FullscreenReq(); got != int32(vgame.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

func TestP1EntDrawsWhenSpriteHitsClip(t *testing.T) {
	clip := vgeo.XYWH[float32](0, 0, 10, 10)
	for _, test := range []struct {
		name string
		x    float32
		want int
	}{
		{name: "overlaps left edge", x: -7, want: 1},
		{name: "touches left edge", x: -8, want: 0},
	} {
		t.Run(test.name, func(t *testing.T) {
			gam := New()
			gam.BoardData = &vboards.Board{WH: vgeo.NewWH[int32](10, 10)}
			gam.Layer(gfx.LayerP1).Clip = clip
			ent := entities.NewP1Ent(
				vgeo.NewXY(test.x, float32(0)), vatlas.Anim{W: 8, H: 13},
			)
			ent.Update(gam)
			if got := len(gam.Layer(gfx.LayerP1).Sprs); got != test.want {
				t.Fatalf("sprites = %v, want %v", got, test.want)
			}
		})
	}
}

func TestZoomLvlAt(t *testing.T) {
	gam := New()
	gam.CanvasPhy().W = 1024
	gam.CanvasPhy().H = 640
	*gam.Cam() = vgeo.NewXY[float32](100, 40)
	gam.UpdateLvlLayers()
	for _, layer := range []vgfx.Layer{
		gfx.LayerTiles,
		gfx.LayerP1,
		gfx.LayerSuperballs,
	} {
		gam.Layer(layer).UpdateCam(*gam.Cam())
	}
	anchor := vgeo.NewXY[float32](256, 160)
	tiles := gam.Layer(gfx.LayerTiles)
	wantXY := tiles.PhyToLayer(anchor)
	if !gam.ZoomLvlAt(anchor, 2) {
		t.Fatal("ZoomLvlAt() = false, want true")
	}
	tiles.UpdateCam(*gam.Cam())
	gotXY := tiles.PhyToLayer(anchor)
	if math.Abs(float64(gotXY.X-wantXY.X)) > .0001 ||
		math.Abs(float64(gotXY.Y-wantXY.Y)) > .0001 {
		t.Errorf("anchor layer XY = %v, want %v", gotXY, wantXY)
	}
	if gam.LvlZoom != 4 {
		t.Errorf("LvlZoom = %v, want 4", gam.LvlZoom)
	}
	for _, layer := range []vgfx.Layer{
		gfx.LayerTiles,
		gfx.LayerP1,
		gfx.LayerSuperballs,
	} {
		if got := gam.Layer(layer).Scale; got != 4 {
			t.Errorf("layer %d scale = %v, want 4", layer, got)
		}
	}
}

func TestZoomLvlAtKeepsStationaryAnchor(t *testing.T) {
	gam := New()
	gam.CanvasPhy().W = 1024
	gam.CanvasPhy().H = 640
	gam.LvlZoom = 40
	*gam.Cam() = vgeo.NewXY[float32](100, 40)
	gam.UpdateLvlLayers()
	tiles := gam.Layer(gfx.LayerTiles)
	tiles.UpdateCam(*gam.Cam())
	anchor := vgeo.NewXY[float32](256, 160)
	want := tiles.PhyToLayer(anchor)
	for range 10 {
		if !gam.ZoomLvlAt(anchor, 1.01) {
			t.Fatal("ZoomLvlAt() = false, want true")
		}
		tiles.UpdateCam(*gam.Cam())
		got := tiles.PhyToLayer(anchor)
		if math.Abs(float64(got.X-want.X)) > .00001 ||
			math.Abs(float64(got.Y-want.Y)) > .00001 {
			t.Fatalf("anchor layer XY = %v, want %v", got, want)
		}
	}
}

func TestClampLvlScale(t *testing.T) {
	tests := []struct {
		name  string
		scale float32
		want  float32
	}{
		{name: "minimum", scale: -100, want: 1},
		{name: "within bounds", scale: 2.25, want: 2.25},
		{name: "maximum", scale: 100, want: 80},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := clampLvlScale(test.scale); got != test.want {
				t.Errorf("clampLvlScale() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestAdjustLvlScaleAt(t *testing.T) {
	gam := New()
	gam.CanvasPhy().W = 1024
	gam.CanvasPhy().H = 640
	gam.UpdateLvlLayers()
	if !gam.AdjustLvlScaleAt(vgeo.XY[float32]{}, .25) {
		t.Fatal("AdjustLvlScaleAt() = false, want true")
	}
	if got, want := gam.LvlZoom, float32(2.25); got != want {
		t.Errorf("LvlZoom = %v, want %v", got, want)
	}
	if got, want := gam.Layer(gfx.LayerTiles).Scale, float32(2.25); got != want {
		t.Errorf("tile scale = %v, want %v", got, want)
	}
}

// reqs fullscreen and wakelock by default.
func TestDefaultFullscreenAndWakelockReqs(t *testing.T) {
	gam := New()
	gam.Router.Update = func(*Eng) vgame.Status { return vgame.Pause }
	gam.Update()
	if !gam.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = false, want true")
	}
	if got := gam.FullscreenReq(); got != int32(vgame.FullscreenReqEnter) {
		t.Errorf("FullscreenReq() = %v, want enter", got)
	}
	if got := gam.ReqWakelockFlag(); got != 1 {
		t.Errorf("ReqWakelockFlag() = %v, want 1", got)
	}

	gam.ReqFullscreen(vgame.FullscreenReqExit)
	gam.DisableWakelock(true)
	gam.Update()
	if got := gam.FullscreenReq(); got != int32(vgame.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
	if got := gam.ReqWakelockFlag(); got != 0 {
		t.Errorf("ReqWakelockFlag() = %v, want 0", got)
	}
}
