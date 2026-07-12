package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

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

func TestLayerConfigAutoscaleFloat(t *testing.T) {
	config := LayerConfig{
		Scale:            3,
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.WH[uint16]{W: 320, H: 180},
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
	if config.Scale != 2.25 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleFloatHeightOnly(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.WH[uint16]{H: 180},
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
	if config.Scale != 2.25 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleFloatWidthOnly(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoFloat,
		AutoscaleMinClip: vgeo.WH[uint16]{W: 320},
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
	if config.Scale != 3 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleInt(t *testing.T) {
	config := LayerConfig{
		ScaleMode:        LayerScaleModeAutoInt,
		AutoscaleMinClip: vgeo.WH[uint16]{W: 320, H: 180},
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
	if config.Scale != 2 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}

	config.UpdateScale(vgeo.WH[float32]{W: 160, H: 90})
	if config.Scale != 1 {
		t.Fatalf("Scale clamp mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleUnset(t *testing.T) {
	config := LayerConfig{
		Scale:     3,
		ScaleMode: LayerScaleModeAutoFloat,
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
	if config.Scale != 3 {
		t.Fatalf("Scale mismatch: got %v", config.Scale)
	}
}

func TestLayerConfigAutoscaleManual(t *testing.T) {
	config := LayerConfig{
		Scale:            3,
		AutoscaleMinClip: vgeo.WH[uint16]{W: 320, H: 180},
	}

	config.UpdateScale(vgeo.WH[float32]{W: 960, H: 405})
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
	config := LayerConfig{Scale: 2}

	got := config.PhyToLayerWHInt(vgeo.WH[uint16]{W: 101, H: 51})
	want := vgeo.WH[uint16]{W: 51, H: 26}
	if got != want {
		t.Fatalf("PhyToLayerWHInt mismatch: got %v want %v", got, want)
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
