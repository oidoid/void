package entities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type CamStatusEnt struct {
	ventities.TextEnt
	Fill   ventities.NinePatchEnt
	Anchor ventities.AnchorEnt
}

func NewCamStatusEnt(fillAnimID vatlas.AnimID, z vgfx.Z) CamStatusEnt {
	this := CamStatusEnt{}
	this.Fill = ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Spr{
			vgeo.DirE:      {AnimCel: fillAnimID.Cel(0)},
			vgeo.DirN:      {AnimCel: fillAnimID.Cel(0)},
			vgeo.DirW:      {AnimCel: fillAnimID.Cel(0)},
			vgeo.DirS:      {AnimCel: fillAnimID.Cel(0)},
			vgeo.DirCenter: {AnimCel: fillAnimID.Cel(0)},
		},
		CornerWH: vgeo.NewWH[uint16](1, 1),
	}
	this.Fill.SetZ(z - 1)
	this.Anchor = ventities.AnchorEnt{
		Dir:    vgeo.DirSE,
		Margin: vgeo.NewXY[float32](4, 0),
	}
	this.Trim = vtext.TrimLead
	this.Z = z
	return this
}

func (this *CamStatusEnt) Update(
	font *vtext.Font,
	sprs *[]vgfx.Spr,
	canvasPhy vgeo.WH[uint16],
	camLvl vgeo.XY[float32],
	fullscreen bool,
	scale float32,
	clip vgeo.Box[float32],
) vgame.Status {
	text := "(" + vtext.FmtFloat(camLvl.X) + ", " + vtext.FmtFloat(camLvl.Y) + ") " +
		vtext.Itoa(int(canvasPhy.W)) + "x" + vtext.Itoa(int(canvasPhy.H))
	if fullscreen {
		text += "f"
	}
	text += "@" + vtext.FmtFloat(scale) + "x"
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	const fillMargin = int16(2)
	w := this.Layout.W + fillMargin*2
	h := this.Layout.TrimAllForceH + fillMargin*2
	anchor := this.Anchor
	if anchor.Ref == nil {
		anchor.Ref = ventities.BoxAnchorRef{Box: clip}
	}
	xy := anchor.XY(float32(w), float32(h))
	this.TextEnt.XY = vgeo.NewXY(
		int16(xy.X)+fillMargin, int16(xy.Y)+fillMargin,
	)

	this.DrawFill(sprs)

	return this.TextEnt.Update(font, sprs, clip)
}

func (this *CamStatusEnt) DrawFill(sprs *[]vgfx.Spr) {
	const margin = int16(2)
	this.Fill.XY = vgeo.NewXY(
		float32(this.TextEnt.XY.X-margin),
		float32(this.TextEnt.XY.Y-margin),
	)

	this.Fill.WH = vgeo.NewWH(
		uint16(this.Layout.W+margin*2),
		uint16(this.Layout.TrimAllForceH+margin*2),
	)
	this.Fill.Update(sprs)
}
