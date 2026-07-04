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
