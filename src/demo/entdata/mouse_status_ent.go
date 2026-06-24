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
	lastButtons uint8
	visible     bool
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
	input *vinput.InputPoll,
	canvasPhy vgeo.WH[uint16],
) vgame.Status {
	loop := vgame.Pause
	// to-do: just unpack to avoid extra conditionals.
	primary := input.PrimaryPointer()
	if primary == nil {
		if this.lastButtons != 0 {
			loop = vgame.Loop
		}
		this.lastButtons = 0
	} else {
		if primary.Buttons != this.lastButtons {
			loop = vgame.Loop
		}
		this.lastButtons = primary.Buttons
		if primary.Device == vinput.PointerDeviceMouse {
			this.visible = true
		}
	}

	if !this.visible {
		return vgame.Pause
	}

	// to-do: canvasPhy is probably incorrect. should be same units of w/h.
	xy := ventdata.HudXY(this.HUDEnt, mouseStatusSize, mouseStatusSize, canvasPhy)
	*sprites = append(
		*sprites,
		vgfx.Sprite{XY: xy, AnimID: assets.MouseStatusBase, Z: vgfx.LayerTop},
	)
	this.addOverlay(sprites, assets.MouseStatusPrimary, xy, this.lastButtons&1 != 0)
	this.addOverlay(sprites, assets.MouseStatusSecondary, xy, this.lastButtons&2 != 0)
	this.addOverlay(sprites, assets.MouseStatusTertiary, xy, this.lastButtons&4 != 0)
	return loop
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
