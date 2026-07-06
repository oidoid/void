package gfx

import "github.com/oidoid/void/src/void/vgfx"

const (
	LayerTiles vgfx.Layer = iota
	LayerSuperballs
	LayerUI
	LayerOutline
	LayerCursor
	LayerGrid
	LayerOverlay
)

const (
	ZSuperball   vgfx.Z = vgfx.Z(uint8(LayerSuperballs) << vgfx.LayerShift)
	ZLevelBorder vgfx.Z = vgfx.Z(uint8(LayerUI)<<vgfx.LayerShift | 1)
	ZUIStatus    vgfx.Z = vgfx.Z(uint8(LayerUI)<<vgfx.LayerShift | 3)
	ZOutline     vgfx.Z = vgfx.Z(uint8(LayerOutline) << vgfx.LayerShift)
	ZCursor      vgfx.Z = vgfx.Z(uint8(LayerCursor) << vgfx.LayerShift)
	ZGrid        vgfx.Z = vgfx.Z(uint8(LayerGrid) << vgfx.LayerShift)
	ZOverlay     vgfx.Z = vgfx.Z(uint8(LayerOverlay) << vgfx.LayerShift)
)

const (
	LevelClipWPhy = uint16(512)
	LevelClipHPhy = uint16(320)
)
