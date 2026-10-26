package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestRenderModeSnapXY(t *testing.T) {
	xy := vgeo.NewXY[float32](-.5, .5)
	for _, test := range []struct {
		mode RenderMode
		want vgeo.XY[float32]
	}{
		{RenderModePixel, vgeo.NewXY[float32](0, 1)},
		{RenderModeFloat, xy},
	} {
		if got := test.mode.SnapXY(xy); got != test.want {
			t.Errorf("mode %v SnapXY(%v) = %v, want %v",
				test.mode, xy, got, test.want)
		}
	}
}
