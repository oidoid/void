package hooks

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

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
