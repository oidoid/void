package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: do i want state for composable ents? do i want to end in ent? do i
// want to do all behavior in hook?
type EntStatusEnt struct {
	ventities.HUDEnt
	ventities.TextEnt
	Bg ventities.NinePatchEnt
}

func NewEntStatusEnt() EntStatusEnt {
	this := EntStatusEnt{}
	this.Bg = ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Sprite{
			vgeo.DirN:      {AnimCel: assets.PaletteBlue.Cel(0)},
			vgeo.DirE:      {AnimCel: assets.PaletteBlue.Cel(0)},
			vgeo.DirS:      {AnimCel: assets.PaletteBlue.Cel(0)},
			vgeo.DirW:      {AnimCel: assets.PaletteBlue.Cel(0)},
			vgeo.DirCenter: {AnimCel: assets.PaletteBlue.Cel(0)},
		},
		CornerWH: vgeo.WH[uint16]{W: 1, H: 1},
	}
	this.Bg.SetZ(gfx.ZUIWidget - 1)
	this.Anchor = vgeo.DirSW
	this.Margin = vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Z = gfx.ZUIWidget
	return this
}

func (this *EntStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	count int,
	spriteCount int,
	clip vgeo.Box[float32],
) vgame.Status {
	this.SetText(
		// to-do: right align.
		// to-do: Ls and ct and st should have zero kern? do i want to join letters? ask AI to analyze existing.
		vtext.Itoa(count) + " superballs\n" +
			vtext.Itoa(spriteCount) + " sprites", // to-do: aggregate sprites from prior frame.
	)

	this.LayoutChars(font)
	// to-do: move to HUDEnt.Update()?
	const bgMargin = int16(2)
	bgXY := this.HUDEnt.XY(
		this.Layout.W+bgMargin*2, this.Layout.TrimAllForceH+bgMargin*2, clip,
	)
	this.TextEnt.XY = vgeo.XY[int16]{X: bgXY.X + bgMargin, Y: bgXY.Y + bgMargin}

	this.drawBackground(sprites)

	return this.TextEnt.Update(font, sprites, clip)
}

func (this *EntStatusEnt) drawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(2)
	// to-do: this isn't great because we keep this fake state. we just want
	// sprites.
	this.Bg.XY = vgeo.NewXY(
		float32(this.TextEnt.XY.X-margin), float32(this.TextEnt.XY.Y-margin),
	)
	this.Bg.WH = vgeo.WH[uint16]{
		W: uint16(this.Layout.W + margin*2),
		H: uint16(this.Layout.TrimAllForceH + margin*2),
	}
	this.Bg.Update(sprites)
}
