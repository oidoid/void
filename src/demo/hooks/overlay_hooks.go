package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func UpdateCheckerboard(gam *engine.Engine) vgame.Status {
	layer := gam.Layer(gfx.LayerOverlay)
	clip := layer.Clip
	layer.Sprites = append(layer.Sprites, vgfx.Sprite{
		AnimCel: assets.BackgroundGreyCheckerboard.Cel(0),
		XY:      clip.Min,
		Z:       gfx.ZOverlay,
		WH:      vgeo.WH[uint16]{W: uint16(clip.W()), H: uint16(clip.H())},
	})
	return vgame.Pause
}
