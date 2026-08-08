package vgfx

import (
	"testing"
	"unsafe"

	"github.com/oidoid/void/src/void/vgeo"
)

func TestLayerConfigExportLayout(t *testing.T) {
	var config LayerConfigExport
	if got := unsafe.Sizeof(config); got != 24 {
		t.Fatalf("LayerConfigExport size = %d, want 24", got)
	}
	if got := unsafe.Offsetof(config.SprsPtr); got != 16 {
		t.Fatalf("SprsPtr offset = %d, want 16", got)
	}
}

func TestLayerConfigNearbox(t *testing.T) {
	config := LayerConfig{Clip: vgeo.NewBox[float32](10, 20, 110, 80)}
	want := vgeo.NewBox[float32](-40, -10, 160, 110)
	if got := config.Nearbox(); got != want {
		t.Fatalf("Nearbox() = %v, want %v", got, want)
	}
}

func TestLayerConfigCoordTransformsApplyCam(t *testing.T) {
	config := LayerConfig{Scale: 2}
	cam := vgeo.NewXY[float32](10, 20)
	layer := vgeo.NewXY[float32](7, 11)
	config.UpdateCam(cam)

	phy := config.LayerToPhy(layer)
	if phy != vgeo.NewXY[float32](4, 2) {
		t.Fatalf("LayerToPhy mismatch: got %v", phy)
	}

	got := config.PhyToLayer(phy)
	if got != layer {
		t.Fatalf("PhyToLayer mismatch: got %v", got)
	}
}

func TestLayerConfigCoordTransformsFixed(t *testing.T) {
	config := LayerConfig{CamMode: LayerCamModeFixed, Scale: 2}
	cam := vgeo.NewXY[float32](10, 20)
	layer := vgeo.NewXY[float32](7, 11)
	config.UpdateCam(cam)

	phy := config.LayerToPhy(layer)
	if phy != vgeo.NewXY[float32](14, 22) {
		t.Fatalf("LayerToPhy mismatch: got %v", phy)
	}

	got := config.PhyToLayer(phy)
	if got != layer {
		t.Fatalf("PhyToLayer mismatch: got %v", got)
	}
}

func TestLayerConfigCoordTransformsClipOrigin(t *testing.T) {
	config := LayerConfig{
		Scale:   2,
		ClipPhy: vgeo.XYWH[uint16](30, 40, 100, 80),
	}
	config.UpdateCam(vgeo.NewXY[float32](10, 20))

	layer := vgeo.NewXY[float32](7, 11)
	phy := config.LayerToPhy(layer)
	if phy != vgeo.NewXY[float32](34, 42) {
		t.Fatalf("LayerToPhy mismatch: got %v", phy)
	}

	got := config.PhyToLayer(phy)
	if got != layer {
		t.Fatalf("PhyToLayer mismatch: got %v", got)
	}
}

func TestLayerConfigPhyToLayerInt(t *testing.T) {
	tests := []struct {
		name   string
		config LayerConfig
		cam    vgeo.XY[float32]
		phy    vgeo.XY[float32]
		want   vgeo.XY[float32]
	}{
		{
			name:   "floors positive",
			config: LayerConfig{Scale: 2},
			phy:    vgeo.NewXY[float32](10.9, 20.1),
			want:   vgeo.NewXY[float32](5, 10),
		},
		{
			name:   "floors negative",
			config: LayerConfig{Scale: 2},
			phy:    vgeo.NewXY[float32](-0.1, 0.1),
			want:   vgeo.NewXY[float32](-1, 0),
		},
		{
			name: "default scale",
			phy:  vgeo.NewXY[float32](10.9, -0.1),
			want: vgeo.NewXY[float32](10, -1),
		},
		{
			name: "clip and cam",
			config: LayerConfig{
				Scale:   2,
				ClipPhy: vgeo.XYWH[uint16](30, 40, 100, 80),
			},
			cam:  vgeo.NewXY[float32](10, 20),
			phy:  vgeo.NewXY[float32](34.9, 42.1),
			want: vgeo.NewXY[float32](7, 11),
		},
		{
			name: "floors negative after clip and cam",
			config: LayerConfig{
				Scale:   2,
				ClipPhy: vgeo.XYWH[uint16](30, 40, 100, 80),
			},
			cam:  vgeo.NewXY[float32](10, 20),
			phy:  vgeo.NewXY[float32](19.9, 19.9),
			want: vgeo.NewXY[float32](-1, -1),
		},
		{
			name: "fixed cam ignores cam",
			config: LayerConfig{
				CamMode: LayerCamModeFixed,
				Scale:   2,
				ClipPhy: vgeo.XYWH[uint16](30, 40, 100, 80),
			},
			cam:  vgeo.NewXY[float32](10, 20),
			phy:  vgeo.NewXY[float32](33.9, 41.9),
			want: vgeo.NewXY[float32](1, 0),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			config := test.config
			config.UpdateCam(test.cam)
			if got := config.PhyToLayerInt(test.phy); got != test.want {
				t.Fatalf("PhyToLayerInt() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestPhyToClipStartEndPx(t *testing.T) {
	tests := []struct {
		name                   string
		phy, phySize, clipSize uint16
		wantStart, wantEnd     uint16
	}{
		{name: "origin", phy: 0, phySize: 2018, clipSize: 673, wantStart: 0, wantEnd: 0},
		{name: "exact edge", phy: 3, phySize: 12, clipSize: 8, wantStart: 2, wantEnd: 2},
		{name: "float edge", phy: 241, phySize: 2018, clipSize: 673, wantStart: 80, wantEnd: 81},
		{name: "one phy px covers a clip px", phy: 1, phySize: 5, clipSize: 3, wantStart: 0, wantEnd: 1},
		{name: "clip is larger than phy", phy: 5, phySize: 7, clipSize: 13, wantStart: 9, wantEnd: 10},
		{name: "edge near end", phy: 6, phySize: 7, clipSize: 13, wantStart: 11, wantEnd: 12},
		{name: "last edge", phy: 2018, phySize: 2018, clipSize: 673, wantStart: 673, wantEnd: 673},
		{name: "max dimensions", phy: 65535, phySize: 65535, clipSize: 65535, wantStart: 65535, wantEnd: 65535},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := PhyToClipStartPx(test.phy, test.phySize, test.clipSize); got != test.wantStart {
				t.Fatalf("PhyToClipStartPx() = %d, want %d", got, test.wantStart)
			}
			if got := PhyToClipEndPx(test.phy, test.phySize, test.clipSize); got != test.wantEnd {
				t.Fatalf("PhyToClipEndPx() = %d, want %d", got, test.wantEnd)
			}
		})
	}
}

func TestLayerConfigAutoscaleFloat(t *testing.T) {
	config := LayerConfig{
		Scale:            3,
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.NewWH[uint16](320, 180),
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 2.25 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleFloatHeightOnly(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.WH[uint16]{H: 180},
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 2.25 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleFloatWidthOnly(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.WH[uint16]{W: 320},
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 3 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleInt(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoInt,
		AutoscaleMinClip: vgeo.NewWH[uint16](320, 180),
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 2 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}

	config.UpdateScale(vgeo.NewWH[float32](160, 90))
	if config.Scale != 1 {
		t.Fatalf("Scale clamp mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleUnset(t *testing.T) {
	config := LayerConfig{
		Scale:     3,
		ScaleMode: LayerScaleModeAutoFloat,
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 3 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleManual(t *testing.T) {
	config := LayerConfig{
		Scale:            3,
		AutoscaleMinClip: vgeo.NewWH[uint16](320, 180),
	}

	config.UpdateScale(vgeo.NewWH[float32](960, 405))
	if config.Scale != 3 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigScaleDefault(t *testing.T) {
	config := LayerConfig{}
	cam := vgeo.NewXY[float32](10, 20)
	layer := vgeo.NewXY[float32](7, 11)
	config.UpdateCam(cam)

	phy := config.LayerToPhy(layer)
	if phy != vgeo.NewXY[float32](-3, -9) {
		t.Fatalf("LayerToPhy mismatch: got %v", phy)
	}
}

func TestLayerConfigPhyToLayerWH(t *testing.T) {
	tests := []struct {
		name  string
		scale float32
		phy   vgeo.WH[uint16]
		want  vgeo.WH[uint16]
	}{
		{
			name: "half physical px", scale: 2,
			phy:  vgeo.NewWH[uint16](101, 51),
			want: vgeo.NewWH[uint16](51, 26),
		},
		{
			name: "one third physical px", scale: 3,
			phy:  vgeo.NewWH[uint16](1024, 640),
			want: vgeo.NewWH[uint16](342, 214),
		},
	}
	for _, test := range tests {
		config := LayerConfig{Scale: test.scale}
		got := config.PhyToLayerWHInt(test.phy)
		if got != test.want {
			t.Fatalf("%s: got %v want %v", test.name, got, test.want)
		}
	}
}

func TestLayerConfigScaleTransforms(t *testing.T) {
	tests := []struct {
		name   string
		config LayerConfig
		phy    vgeo.XY[float32]
		layer  vgeo.XY[float32]
	}{
		{
			name:   "default scale",
			config: LayerConfig{},
			phy:    vgeo.NewXY[float32](10, 20),
			layer:  vgeo.NewXY[float32](10, 20),
		},
		{
			name:   "configured scale",
			config: LayerConfig{Scale: 2},
			phy:    vgeo.NewXY[float32](10, 20),
			layer:  vgeo.NewXY[float32](5, 10),
		},
		{
			name:   "fractional scale",
			config: LayerConfig{Scale: 2.5},
			phy:    vgeo.NewXY[float32](10, 20),
			layer:  vgeo.NewXY[float32](4, 8),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := test.config.PhyToLayerScale(test.phy); got != test.layer {
				t.Fatalf("PhyToLayerScale mismatch: got %v", got)
			}

			if got := test.config.LayerToPhyScale(test.layer); got != test.phy {
				t.Fatalf("LayerToPhyScale mismatch: got %v", got)
			}
		})
	}
}
