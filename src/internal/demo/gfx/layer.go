package gfx

import "github.com/oidoid/void/src/void/vgfx"

const (
	LayerTiles vgfx.Layer = iota
	LayerP1
	LayerSuperballs
	LayerUI
	LayerViewportEdge
	LayerCursor
	LayerOverlay
	LayerGrid
)

var (
	ZP1           vgfx.Z = LayerP1.Z(0)
	ZSuperball    vgfx.Z = LayerSuperballs.Z(0)
	ZUILevelEdge  vgfx.Z = LayerUI.Z(0)
	ZUIFill       vgfx.Z = LayerUI.Z(1)
	ZUIWidget     vgfx.Z = LayerUI.Z(2)
	ZUIText       vgfx.Z = LayerUI.Z(3)
	ZViewportEdge vgfx.Z = LayerViewportEdge.Z(0)
	ZCursor       vgfx.Z = LayerCursor.Z(0)
	ZOverlay      vgfx.Z = LayerOverlay.Z(0)
	ZGrid         vgfx.Z = LayerGrid.Z(0)
)

const (
	LevelClipWPhy = uint16(512)
	LevelClipHPhy = uint16(320)
)
