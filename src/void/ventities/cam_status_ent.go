package ventities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: move to demo.
type CamStatusEnt struct {
	TextEnt
	Bg     NinePatchEnt
	Anchor AnchorEnt
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
	this.Anchor = AnchorEnt{
		Dir:    vgeo.DirSE,
		Margin: vgeo.NewXY[float32](4, 0),
	}
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
	w := this.Layout.W + bgMargin*2
	h := this.Layout.TrimAllForceH + bgMargin*2
	anchor := this.Anchor
	if anchor.Ref == nil {
		anchor.Ref = BoxAnchorRef{Box: clip}
	}
	xy := anchor.XY(float32(w), float32(h))
	this.TextEnt.XY = vgeo.XY[int16]{
		X: int16(xy.X) + bgMargin, Y: int16(xy.Y) + bgMargin,
	}

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
