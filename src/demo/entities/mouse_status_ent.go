package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

type MouseStatusEnt struct {
	ventities.HUDEnt
	visible bool
}

const mouseStatusSize = int16(16)

func NewMouseStatusEnt() MouseStatusEnt {
	this := MouseStatusEnt{}
	this.Anchor = vgeo.DirSE
	this.Margin = vgeo.Edge[int16]{E: 4, S: 14}
	return this
}

func (this *MouseStatusEnt) Update(
	sprs *[]vgfx.Spr,
	in *vin.In,
	clip vgeo.Box[float32],
) vgame.Status {
	this.visible = this.visible || in.Ptr.Device() == vin.PointerDeviceMouse
	if !this.visible {
		return vgame.Pause
	}

	hudXY := this.HUDEnt.XY(mouseStatusSize, mouseStatusSize, clip)
	xy := vgeo.NewXY(float32(hudXY.X), float32(hudXY.Y))
	*sprs = append(
		*sprs,
		vgfx.Spr{XY: xy, AnimCel: assets.MouseStatusBase.Cel(0), Z: gfx.ZUIWidget},
	)
	clicks := in.Ptr.Clicks()
	this.addOverlay(sprs, assets.MouseStatusPrimary, xy, clicks&vin.ClickPrimary != 0)
	this.addOverlay(sprs, assets.MouseStatusSecondary, xy, clicks&vin.ClickSecondary != 0)
	this.addOverlay(sprs, assets.MouseStatusAux, xy, clicks&vin.ClickAux != 0)
	if in.Dirty {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *MouseStatusEnt) addOverlay(
	sprs *[]vgfx.Spr,
	animID vatlas.AnimID,
	xy vgeo.XY[float32],
	on bool,
) {
	if !on {
		return
	}
	*sprs = append(
		*sprs, vgfx.Spr{XY: xy, AnimCel: animID.Cel(0), Z: gfx.ZUIWidget},
	)
}
