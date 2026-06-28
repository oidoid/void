package entdata

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
)

type MouseStatusEnt struct {
	ventdata.HUDEnt
	visible bool
}

const mouseStatusSize = float32(16)

func NewMouseStatusEnt() MouseStatusEnt {
	this := MouseStatusEnt{}
	this.Anchor = vgeo.DirSE
	this.Margin = vgeo.Border[int16]{E: 4, S: 14}
	return this
}

func (this *MouseStatusEnt) Update(
	sprites *[]vgfx.Sprite,
	in *vinput.In,
	canvasPhy vgeo.WH[uint16],
) vgame.Status {
	this.visible = this.visible || in.Ptr.Device() == vinput.PointerDeviceMouse
	if !this.visible {
		return vgame.Pause
	}

	// to-do: canvasPhy is probably incorrect. should be same units of w/h.
	xy := ventdata.HudXY(this.HUDEnt, mouseStatusSize, mouseStatusSize, canvasPhy)
	*sprites = append(
		*sprites,
		vgfx.Sprite{XY: xy, AnimID: assets.MouseStatusBase, Z: vgfx.LayerTop},
	)
	clicks := in.Ptr.Clicks()
	this.addOverlay(sprites, assets.MouseStatusPrimary, xy, clicks&1 != 0)
	this.addOverlay(sprites, assets.MouseStatusSecondary, xy, clicks&2 != 0)
	this.addOverlay(sprites, assets.MouseStatusTertiary, xy, clicks&4 != 0)
	if in.Dirty {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *MouseStatusEnt) addOverlay(
	sprites *[]vgfx.Sprite,
	animID vatlas.AnimID,
	xy vgeo.XY[float32],
	on bool,
) {
	if !on {
		return
	}
	*sprites = append(
		*sprites, vgfx.Sprite{XY: xy, AnimID: animID, Z: vgfx.LayerTop},
	)
}
