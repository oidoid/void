package vgfx

import (
	"github.com/oidoid/void/src/void/vgeo"
)

// how a layer's pixel coords are resolved.
type LayerRenderMode uint8

const (
	LayerRenderModeInt   LayerRenderMode = iota // pixelated.
	LayerRenderModeFloat                        // smooth.
)

// whether camera offset is applied to a layer.
type LayerCamMode uint8

const (
	// to-do: rename
	LayerCamModeApply LayerCamMode = iota
	LayerCamModeFixed
)

// how a layer scale is resolved each frame.
type LayerScaleMode uint8

const (
	LayerScaleModeManual LayerScaleMode = iota
	LayerScaleModeAutoFloat
	LayerScaleModeAutoInt
)

// per-layer render config and state.
type LayerConfig struct {
	// described in this layer's coord system.
	Sprites []Sprite
	// to-do: necessary? we only care about int mode in cam and shader modulo.
	RenderMode LayerRenderMode
	// physical clipbox. zero width or height means full canvas. used for GPU
	// scissorbox. to-do: this isn't great because Clip is derived and testing
	// ClipPhy at 0,0,0,0 should be valid.
	ClipPhy vgeo.Box[uint16]
	// clipbox in this layer's coordinate system derived from `ClipPhy`.
	Clip vgeo.Box[float32]
	// effective camera for this layer after mode is applied. updated by vengine.
	Cam              vgeo.XY[float32]
	CamMode          LayerCamMode
	Scale            float32
	ScaleMode        LayerScaleMode
	AutoscaleMinClip vgeo.WH[uint16]
	Shader           Shader
	NoDepth          bool
}

// packed layer config.
type LayerConfigExport struct {
	RenderMode  LayerRenderMode
	CamMode     LayerCamMode
	Shader      Shader
	NoDepth     uint8
	ClipXPhy    uint16
	ClipYPhy    uint16
	ClipWPhy    uint16
	ClipHPhy    uint16
	Scale       float32
	SpritesPtr  uint32
	SpriteCount uint32
}

func NewLayerConfig(capacity int) LayerConfig {
	return LayerConfig{
		Sprites: make([]Sprite, 0, capacity),
		CamMode: LayerCamModeApply,
		Shader:  ShaderSprites,
	}
}

func (this *LayerConfig) LayerToPhy(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.XY[float32]{
		X: xy.X*scale - this.Cam.X,
		Y: xy.Y*scale - this.Cam.Y,
	}
}

func (this *LayerConfig) PhyToLayer(xy vgeo.XY[float32]) vgeo.XY[float32] {
	scale := this.ScaleOrDefault()
	return vgeo.XY[float32]{
		X: (xy.X + this.Cam.X) / scale,
		Y: (xy.Y + this.Cam.Y) / scale,
	}
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
