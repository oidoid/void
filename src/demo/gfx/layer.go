package gfx

import "github.com/oidoid/void/src/void/vgfx"

const (
	LayerTiles vgfx.Layer = iota
	LayerSuperballs
	LayerUI
	LayerOutline
	LayerCursor
	LayerCheckerboard
)

const (
	ZSuperball    vgfx.Z = vgfx.Z(uint8(LayerSuperballs) << vgfx.LayerShift)
	ZLevelBorder  vgfx.Z = vgfx.Z(uint8(LayerUI)<<vgfx.LayerShift | 1)
	ZOutline      vgfx.Z = vgfx.Z(uint8(LayerOutline) << vgfx.LayerShift)
	ZCursor       vgfx.Z = vgfx.Z(uint8(LayerCursor) << vgfx.LayerShift)
	ZCheckerboard vgfx.Z = vgfx.Z(uint8(LayerCheckerboard) << vgfx.LayerShift)
)
