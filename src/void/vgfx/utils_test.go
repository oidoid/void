package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestDiagonalizeXY(t *testing.T) {
	xy := vgeo.NewXY[float32](3.75, 8.25)
	if got := DiagonalizeXY(xy, vgeo.NewXY[float32](1, 1)); got != vgeo.NewXY[float32](3.5, 8.5) {
		t.Fatalf("same-sign diagonal mismatch: got %v", got)
	}
	if got := DiagonalizeXY(xy, vgeo.NewXY[float32](1, -1)); got != vgeo.NewXY[float32](3.5, 8.5-1.0/64) {
		t.Fatalf("opposite-sign diagonal mismatch: got %v", got)
	}
	if got := DiagonalizeXY(xy, vgeo.NewXY[int8](1, -1)); got != vgeo.NewXY[float32](3.5, 8.5-1.0/64) {
		t.Fatalf("integer direction mismatch: got %v", got)
	}
	if got := DiagonalizeXY(xy, vgeo.NewXY[float32](1, 0)); got != xy {
		t.Fatalf("non-diagonal mismatch: got %v, want %v", got, xy)
	}
}
