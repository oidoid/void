package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestSnapXY(t *testing.T) {
	tests := []struct {
		name string
		xy   vgeo.XY[float32]
		by   vgeo.XY[float32]
		want vgeo.XY[float32]
	}{
		{
			name: "positive",
			xy:   vgeo.NewXY[float32](-10.25, -10.25),
			by:   vgeo.NewXY[float32](1, 1),
			want: vgeo.NewXY[float32](-10, -10),
		},
		{
			name: "negative",
			xy:   vgeo.NewXY[float32](-10.25, -10.25),
			by:   vgeo.NewXY[float32](-1, -1),
			want: vgeo.NewXY[float32](-11, -11),
		},
		{
			name: "nearest",
			xy:   vgeo.NewXY[float32](-10.25, -10.75),
			want: vgeo.NewXY[float32](-10, -11),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := SnapXY(test.xy, test.by); got != test.want {
				t.Errorf("SnapXY() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestSnapMove(t *testing.T) {
	tests := []struct {
		name   string
		xy     vgeo.XY[float32]
		snapXY vgeo.XY[float32]
		by     vgeo.XY[float32]
		want   vgeo.XY[float32]
	}{
		{
			name:   "cardinal",
			xy:     vgeo.NewXY[float32](.25, 5),
			snapXY: vgeo.NewXY[float32](0, 5),
			by:     vgeo.NewXY[float32](.25, 0),
			want:   vgeo.NewXY[float32](0, 5),
		},
		{
			name: "diagonal",
			xy:   vgeo.NewXY[float32](1, 2),
			by:   vgeo.NewXY[float32](1, 1),
			want: vgeo.NewXY[float32](1, 1),
		},
		{
			name: "opposite diagonal",
			xy:   vgeo.NewXY[float32](-2, 1),
			by:   vgeo.NewXY[float32](-1, 1),
			want: vgeo.NewXY[float32](-1, 1),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := SnapMove(test.xy, test.snapXY, test.by); got != test.want {
				t.Errorf("SnapMove() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestSnapMoveAxis(t *testing.T) {
	tests := []struct {
		name string
		x    float32
		by   float32
		want float32
	}{
		{name: "positive partial", x: .25, by: 1},
		{name: "positive reached", x: 1, by: 1, want: 1},
		{name: "negative partial", x: -.25, by: -1},
		{name: "negative reached", x: -1, by: -1, want: -1},
		{name: "still", x: .6, want: 1},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := snapMoveAxis(test.x, test.by); got != test.want {
				t.Errorf("snapMoveAxis() = %v, want %v", got, test.want)
			}
		})
	}
}
