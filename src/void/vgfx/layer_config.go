package vgfx

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// whether camera offset is applied to a layer.
type LayerCamMode uint8

const (
	// to-do: rename
	LayerCamModeApply LayerCamMode = iota
	LayerCamModeFixed
)

// how a layer's sprs are composited onto the framebuffer.
type LayerBlendMode uint8

const (
	LayerBlendModeAlpha LayerBlendMode = iota // transparent blending.
	// multiply destination by source RGB; use for translucent overlays.
	LayerBlendModeMultiply
	// replace destination entirely; use for full-screen postprocessing.
	LayerBlendModeReplace
)

// bit positions within the packed flags byte in LayerConfigExport.Flags.
const (
	LayerFlagsDepthShift           = uint8(0)
	LayerFlagsDepthFlag            = uint8(0x1)
	LayerFlagsDepthMask      uint8 = 0x1
	LayerFlagsBlendModeShift       = uint8(1)
	LayerFlagsBlendModeMask  uint8 = 0x3
)

type LayerScaleMode uint8

const (
	LayerScaleModeManual LayerScaleMode = iota
	LayerScaleModeAutoFloat
	LayerScaleModeAutoInt
)

// per-layer render config and state.
type LayerConfig struct {
	// described in this layer's coord system.
	Sprs []Spr
	// physical clipbox. zero width or height means the full canvas.
	ClipPhy vgeo.Box[uint16]
	// clipbox in this layer's coordinate system derived from `ClipPhy`. always
	// prefer phy values to converting layer clip to avoid rounding errors.
	Clip vgeo.Box[float32]
	// effective camera for this layer after mode is applied. updated by vengine.
	Cam               vgeo.XY[float32]
	CamMode           LayerCamMode
	Scale             float32
	ScaleMode         LayerScaleMode
	AutoscaleMinClip  vgeo.WH[uint16]
	AutoscaleMaxScale uint8 // caps computed scale; 0 = uncapped.
	Shader            Shader
	BlendMode         LayerBlendMode
	Depth             bool
}

// packed layer config.
type LayerConfigExport struct {
	CamMode  LayerCamMode
	Shader   Shader
	Flags    uint8
	ClipXPhy uint16
	ClipYPhy uint16
	ClipWPhy uint16
	ClipHPhy uint16
	Scale    float32
	SprsPtr  uint32
	SprCount uint32
}

func PhyToClipStartPx(phy, phySize, layerSize uint16) uint16 {
	return uint16(uint64(phy) * uint64(layerSize) / uint64(phySize))
}

func PhyToClipEndPx(phy, phySize, layerSize uint16) uint16 {
	return uint16(
		(uint64(phy)*uint64(layerSize) + uint64(phySize) - 1) /
			uint64(phySize),
	)
}

func NewLayerConfig(capacity int) LayerConfig {
	return LayerConfig{
		Sprs:    make([]Spr, 0, capacity),
		CamMode: LayerCamModeApply,
		Shader:  ShaderSprs,
	}
}

func (this *LayerConfig) Nearbox() vgeo.Box[float32] {
	clip := this.Clip
	hw := clip.W() / 2
	hh := clip.H() / 2
	return vgeo.NewBox(clip.Min.X-hw, clip.Min.Y-hh, clip.Max.X+hw, clip.Max.Y+hh)
}

// converts a layer delta to a physical delta.
func (this *LayerConfig) LayerToPhyScale(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.NewXY(xy.X*scale, xy.Y*scale)
}

// converts a physical delta to a layer delta.
func (this *LayerConfig) PhyToLayerScale(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.NewXY(xy.X/scale, xy.Y/scale)
}

// converts physical pixels to layer coords, applying cam and clip.
func (this *LayerConfig) PhyToLayer(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.NewXY(
		(xy.X-this.offsetPhy().X+this.Cam.X)/scale,
		(xy.Y-this.offsetPhy().Y+this.Cam.Y)/scale,
	)
}

// converts a physical origin to the containing layer pixel origin.
func (this *LayerConfig) PhyToLayerInt(xy vgeo.XY[float32]) vgeo.XY[float32] {
	xy = this.PhyToLayer(xy)
	return vgeo.NewXY(vmath.Floor(xy.X), vmath.Floor(xy.Y))
}

// converts a layer coord to physical pixels, applying cam and clip.
func (this *LayerConfig) LayerToPhy(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.NewXY(
		xy.X*scale+this.offsetPhy().X-this.Cam.X,
		xy.Y*scale+this.offsetPhy().Y-this.Cam.Y,
	)
}

// converts a physical size to a ceil layer size.
func (this *LayerConfig) PhyToLayerWHInt(wh vgeo.WH[uint16]) vgeo.WH[uint16] {
	scale := this.ScaleOrDefault()
	w := uint16(float32(wh.W) / scale)
	h := uint16(float32(wh.H) / scale)
	if float32(w)*scale < float32(wh.W) {
		w++
	}
	if float32(h)*scale < float32(wh.H) {
		h++
	}
	return vgeo.NewWH(w, h)
}

func (this *LayerConfig) ScaleOrDefault() float32 {
	if this.Scale == 0 {
		return 1
	}
	return this.Scale
}

func (this *LayerConfig) UpdateScale(clip vgeo.WH[float32]) {
	if this.ScaleMode == LayerScaleModeManual {
		return
	}
	auto := this.AutoscaleMinClip
	if auto.W == 0 && auto.H == 0 {
		return
	}
	scale := float32(0)
	if auto.W != 0 {
		scale = clip.W / float32(auto.W)
	}
	if auto.H != 0 {
		hScale := clip.H / float32(auto.H)
		if scale == 0 || hScale < scale {
			scale = hScale
		}
	}
	if scale == 0 {
		return
	}
	if this.ScaleMode == LayerScaleModeAutoInt {
		scale = float32(int(scale))
		if scale < 1 {
			scale = 1
		}
		if this.AutoscaleMaxScale != 0 && scale > float32(this.AutoscaleMaxScale) {
			scale = float32(this.AutoscaleMaxScale)
		}
	}
	this.Scale = scale
}

func (this *LayerConfig) UpdateCam(cam vgeo.XY[float32]) {
	if this.CamMode == LayerCamModeFixed {
		this.Cam = vgeo.XY[float32]{}
		return
	}
	this.Cam = cam
}

func (this *LayerConfig) offsetPhy() vgeo.XY[float32] {
	if this.ClipPhy.W() == 0 || this.ClipPhy.H() == 0 {
		return vgeo.XY[float32]{} // clip is viewport.
	}
	return vgeo.NewXY(
		float32(this.ClipPhy.Min.X),
		float32(this.ClipPhy.Min.Y),
	)
}
