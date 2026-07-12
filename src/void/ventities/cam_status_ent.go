package ventities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type CamStatusEnt struct {
	HUDEnt
	TextEnt
	Bg NinePatchEnt
}

func NewCamStatusEnt(bgAnimID vatlas.AnimID, z vgfx.Z) CamStatusEnt {
	this := CamStatusEnt{}
	this.Bg = NinePatchEnt{
		PatchByDir: [9]vgfx.Sprite{
			vgeo.DirN:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirE:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirS:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirW:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirCenter: {AnimCel: bgAnimID.Cel(0)},
		},
		CornerWH: vgeo.WH[uint16]{W: 1, H: 1},
	}
	this.Bg.SetZ(z - 1)
	this.Anchor = vgeo.DirNE
	this.Margin = vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Trim = vtext.TrimLead
	this.Z = z
	return this
}

func (this *CamStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	canvasPhy vgeo.WH[uint16],
	cam vgeo.XY[float32],
	fullscreen bool,
	clip vgeo.Box[float32],
) vgame.Status {
	text := "(" + vtext.FmtFloat(cam.X) + ", " + vtext.FmtFloat(cam.Y) + ") " +
		vtext.Itoa(int(canvasPhy.W)) + "x" + vtext.Itoa(int(canvasPhy.H))
	if fullscreen {
		text += "f"
	}
	// to-do: @<cam scale>.
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	const bgMargin = int16(2)
	bgXY := this.HUDEnt.XY(
		this.Layout.W+bgMargin*2, this.Layout.TrimAllForceH+bgMargin*2, clip,
	)
	this.TextEnt.XY = vgeo.XY[int16]{X: bgXY.X + bgMargin, Y: bgXY.Y + bgMargin}

	this.DrawBackground(sprites)

	return this.TextEnt.Update(font, sprites, clip)
}

func (this *CamStatusEnt) DrawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(2)
	this.Bg.XY = vgeo.NewXY(
		float32(this.TextEnt.XY.X-margin), float32(this.TextEnt.XY.Y-margin),
	)
	this.Bg.WH = vgeo.WH[uint16]{
		W: uint16(this.Layout.W + margin*2),
		H: uint16(this.Layout.TrimAllForceH + margin*2),
	}
	this.Bg.Update(sprites)
}
