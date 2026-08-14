package hooks

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

func TestPinchZoom(t *testing.T) {
	tests := []struct {
		name  string
		pinch vin.Pinch
		want  float32
	}{
		{
			name:  "start",
			pinch: vin.Pinch{SpanPhy: vgeo.NewXY[float32](2, 0)},
			want:  1,
		},
		{
			name: "double",
			pinch: vin.Pinch{
				SpanPhy:  vgeo.NewXY[float32](4, 0),
				DeltaPhy: vgeo.NewXY[float32](2, 0),
			},
			want: 2,
		},
		{
			name: "diagonal double",
			pinch: vin.Pinch{
				SpanPhy:  vgeo.NewXY[float32](6, 8),
				DeltaPhy: vgeo.NewXY[float32](3, 4),
			},
			want: 2,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := pinchZoom(&test.pinch); got != test.want {
				t.Errorf("pinchZoom() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestWheelZoom(t *testing.T) {
	tests := []struct {
		delta float32
		want  float32
	}{
		{delta: -100, want: 1.25},
		{delta: 0, want: 1},
		{delta: 100, want: .8},
	}
	for _, test := range tests {
		if got := wheelZoom(test.delta); got != test.want {
			t.Errorf("wheelZoom(%v) = %v, want %v", test.delta, got, test.want)
		}
	}
}

func TestKeyZoom(t *testing.T) {
	if keyZoomDelta != .25 {
		t.Errorf("keyZoomDelta = %v, want .25", keyZoomDelta)
	}
}

func TestLvlEdge(t *testing.T) {
	tests := []struct {
		name      string
		canvasPhy vgeo.WH[uint16]
		clipPhy   vgeo.Box[uint16]
		scale     float32
		wantEdge  vgeo.Box[float32]
	}{
		{
			name:      "float clip resolution",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](80, 48, 593, 369),
		},
		{
			name:      "exact clip resolution",
			canvasPhy: vgeo.NewWH[uint16](2000, 1200),
			clipPhy:   vgeo.XYWH[uint16](240, 160, 1520, 880),
			scale:     4,
			wantEdge:  vgeo.NewBox[float32](60, 40, 440, 260),
		},
		{
			name:      "float scale with float clip width",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     2.5,
			wantEdge:  vgeo.NewBox[float32](96, 58, 712, 442),
		},
		{
			name:      "float scale with float clip axes",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     1.5,
			wantEdge:  vgeo.NewBox[float32](160, 96, 1186, 738),
		},
		{
			name:      "full canvas edges",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](0, 0, 2018, 1250),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](0, 0, 673, 417),
		},
		{
			name:      "default scale",
			canvasPhy: vgeo.NewWH[uint16](200, 120),
			clipPhy:   vgeo.XYWH[uint16](20, 20, 160, 80),
			wantEdge:  vgeo.NewBox[float32](20, 20, 180, 100),
		},
		{
			name:      "float clip width only",
			canvasPhy: vgeo.NewWH[uint16](2018, 1200),
			clipPhy:   vgeo.XYWH[uint16](241, 180, 1536, 840),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](80, 60, 593, 340),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ui := vgfx.LayerConfig{Scale: test.scale}
			edge := lvlEdge(test.clipPhy, test.canvasPhy, &ui)
			if got := edge; got != test.wantEdge {
				t.Fatalf("lvlEdge() = %v, want %v", got, test.wantEdge)
			}
		})
	}
}
