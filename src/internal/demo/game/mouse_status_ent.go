package game

import (
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

type MouseStatusEnt struct {
	veng.HUDEnt
	visible bool
}

const mouseStatusSize = int16(16)

func NewMouseStatusEnt() MouseStatusEnt {
	this := MouseStatusEnt{}
	this.Anchor = vgeo.DirSE
	this.Margin = vgeo.Edge[int16]{E: 4, S: 14}
	return this
}

func (this *MouseStatusEnt) Update(gam *Game) veng.Status {
	layer := gam.Layer(gfx.LayerUI)
	in := gam.In()
	sprs := &layer.Sprs
	this.visible = this.visible || in.Ptr.Device() == vin.PtrDevMouse
	if !this.visible {
		return veng.Pause
	}

	hudXY := this.HUDEnt.XY(mouseStatusSize, mouseStatusSize, layer.Clip)
	xy := hudXY.Cast[float32]()
	*sprs = append(
		*sprs,
		vgfx.Spr{XY: xy, TagCel: tags.MouseStatusBase.Cel(0), Z: gfx.ZUIWidget},
	)
	clicks := in.Ptr.Clicks()
	this.addOverlay(sprs, tags.MouseStatusPrimary, xy, clicks&vin.ClickPrimary != 0)
	this.addOverlay(sprs, tags.MouseStatusSecondary, xy, clicks&vin.ClickSecondary != 0)
	this.addOverlay(sprs, tags.MouseStatusAux, xy, clicks&vin.ClickAux != 0)
	this.addOverlay(sprs, tags.MouseStatusLocked, xy, gam.Ptrlock())
	if in.Dirty {
		return veng.Loop
	}
	return veng.Pause
}

func (this *MouseStatusEnt) addOverlay(
	sprs *[]vgfx.Spr,
	tag vatlas.Tag,
	xy vgeo.XY[float32],
	on bool,
) {
	if !on {
		return
	}
	*sprs = append(
		*sprs, vgfx.Spr{XY: xy, TagCel: tag.Cel(0), Z: gfx.ZUIWidget},
	)
}
