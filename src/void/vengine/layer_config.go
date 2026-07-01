package vengine

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
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
	LayerCamModeApply LayerCamMode = iota
	LayerCamModeFixed
)

// per-layer render config and state.
type LayerConfig struct {
	// described in this layer's coord system.
	Sprites []vgfx.Sprite
	// to-do: necessary? we only care about int mode in cam and shader modulo.
	RenderMode LayerRenderMode
	ClipPhy    vgeo.Box[uint16]
	CamMode    LayerCamMode
	Scale      float32
	Shader     vgfx.Shader
	NoDepth    bool
}

// packed layer config.
type LayerConfigExport struct {
	RenderMode  LayerRenderMode
	CamMode     LayerCamMode
	Shader      vgfx.Shader
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
		Sprites: make([]vgfx.Sprite, 0, capacity),
		CamMode: LayerCamModeApply,
		Shader:  vgfx.ShaderSprites,
	}
}

func (this *LayerConfig) ScaleOrDefault() float32 {
	if this.Scale == 0 {
		return 1
	}
	return this.Scale
}
