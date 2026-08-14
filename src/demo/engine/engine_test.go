package engine

import (
	"math"
	"testing"

	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

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
