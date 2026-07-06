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
}

func NewEntStatusEnt() EntStatusEnt {
	this := EntStatusEnt{}
	this.Anchor = vgeo.DirSW
	this.Margin = vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Z = gfx.ZUIStatus
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
		// to-do: Ls and ct and st should have zero kern? do i want to join letters? ask AI to analyze existing.
		vtext.PadInt(count, 7) + " superballs\n" +
			vtext.PadInt(spriteCount, 7) + " sprites", // to-do: aggregate sprites from prior frame.
	)

	this.LayoutChars(font)
	this.TextEnt.XY = this.HUDEnt.XY(this.Layout.W, this.Layout.TrimLeadForceH, clip)

	this.drawBackground(sprites)

	return this.TextEnt.Update(font, sprites, clip)
}

func (this *EntStatusEnt) drawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(1)
	*sprites = append(*sprites, vgfx.Sprite{
		AnimCel: assets.BackgroundKiwi.Cel(0),
		XY:      vgeo.NewXY(float32(this.TextEnt.XY.X-margin), float32(this.TextEnt.XY.Y-margin)),
		Z:       this.Z - 1,
		WH: vgeo.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimLeadForceH + margin*2),
		},
	})
}
