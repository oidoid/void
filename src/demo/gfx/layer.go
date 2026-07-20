package gfx

import "github.com/oidoid/void/src/void/vgfx"

const (
	LayerTiles vgfx.Layer = iota
	LayerSuperballs
	LayerUI
	LayerClock
	LayerOutline
	LayerCursor
	LayerOverlay
	LayerGrid
)

var (
	ZSuperball     vgfx.Z = LayerSuperballs.Z(0)
	ZUILevelBorder vgfx.Z = LayerUI.Z(0)
	ZUIBackground  vgfx.Z = LayerUI.Z(1)
	ZUIWidget      vgfx.Z = LayerUI.Z(2)
	ZUIText        vgfx.Z = LayerUI.Z(3)
	ZClock         vgfx.Z = LayerClock.Z(0)
	ZOutline       vgfx.Z = LayerOutline.Z(0)
	ZCursor        vgfx.Z = LayerCursor.Z(0)
	ZOverlay       vgfx.Z = LayerOverlay.Z(0)
	ZGrid          vgfx.Z = LayerGrid.Z(0)
)

const (
	LevelClipWPhy = uint16(512)
	LevelClipHPhy = uint16(320)
)
