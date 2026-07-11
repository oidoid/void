package ventities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

type ButtonEnt struct {
	NinePatchEnt    // border is overwritten.
	UnfocusedBorder vatlas.AnimID
	FocusedBorder   vatlas.AnimID
	Toggle          bool // false: button, true: switch.
	On              bool
	Start           bool
	Focused         bool
}

func (this *ButtonEnt) Update(
	in *vin.In, sprites *[]vgfx.Sprite, layer *vgfx.LayerConfig,
) vgame.Status {
	this.Start = false
	if phy := in.Ptr.CenterPhy(); phy != nil {
		xy := layer.PhyToLayer(*phy) // to-do: can input expose a layer XY?
		bounds := vgeo.XYWH(
			this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
		)
		this.Focused = bounds.HitsXY(xy)
	}
	wasOn := this.On
	if this.Toggle {
		if this.Focused && in.IsOnStart(vin.ButtonA) {
			this.On = !this.On
		}
	} else {
		this.On = this.Focused && in.IsOn(vin.ButtonA)
	}
	this.Start = wasOn != this.On

	bounds := vgeo.XYWH(
		this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
	)
	if !layer.Clip.HitsBox(bounds) {
		return vgame.Pause
	}

	border := this.UnfocusedBorder
	if this.Focused {
		border = this.FocusedBorder
	}
	this.AnimByDir[vgeo.DirN] = border // to-do: palette swap.
	this.AnimByDir[vgeo.DirE] = border
	this.AnimByDir[vgeo.DirS] = border
	this.AnimByDir[vgeo.DirW] = border
	this.NinePatchEnt.Update(sprites)

	if this.Start {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *ButtonEnt) OnStart() bool {
	return this.On && this.Start
}
