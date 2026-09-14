package entities

import (
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

const UIButtonGap = int16(4)

func NewWidgetNinePatch() ventities.NinePatchEnt {
	edge := vgfx.Spr{TagCel: tags.WidgetEdgeLight.Cel(0)}
	fill := vgfx.Spr{TagCel: tags.WidgetFill.Cel(0)}
	return ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Spr{
			vgeo.DirE:      edge,
			vgeo.DirN:      edge,
			vgeo.DirW:      edge,
			vgeo.DirS:      edge,
			vgeo.DirCenter: fill,
		},
		CornerWH: vgeo.NewWH[uint16](1, 1),
	}
}
