package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
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
	this.Bg = ventities.NewNinePatchEnt(
		[9]vatlas.AnimID{
			vgeo.DirN:      assets.BackgroundKiwi,
			vgeo.DirE:      assets.BackgroundKiwi,
			vgeo.DirS:      assets.BackgroundKiwi,
			vgeo.DirW:      assets.BackgroundKiwi,
			vgeo.DirCenter: assets.BackgroundKiwi,
		},
		vgeo.WH[uint16]{W: 1, H: 1},
	)
	this.Bg.Z = gfx.ZUIWidget - 1
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
	this.TextEnt.XY = this.HUDEnt.XY(this.Layout.W, this.Layout.TrimLeadForceH, clip)

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
		H: uint16(this.Layout.TrimLeadForceH + margin*2),
	}
	this.Bg.Update(sprites)
}
