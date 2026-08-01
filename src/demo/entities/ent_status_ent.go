package entities

import (
	"strings"

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
	Fill ventities.NinePatchEnt
}

func NewEntStatusEnt() EntStatusEnt {
	this := EntStatusEnt{}
	this.Fill = ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Spr{
			vgeo.DirN:      {AnimCel: assets.ColorBlue.Cel(0)},
			vgeo.DirE:      {AnimCel: assets.ColorBlue.Cel(0)},
			vgeo.DirS:      {AnimCel: assets.ColorBlue.Cel(0)},
			vgeo.DirW:      {AnimCel: assets.ColorBlue.Cel(0)},
			vgeo.DirCenter: {AnimCel: assets.ColorBlue.Cel(0)},
		},
		CornerWH: vgeo.WH[uint16]{W: 1, H: 1},
	}
	this.Fill.SetZ(gfx.ZUIWidget - 1)
	this.Anchor = vgeo.DirSW
	this.Margin = vgeo.Edge[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Z = gfx.ZUIWidget
	return this
}

func (this *EntStatusEnt) Update(
	font *vtext.Font,
	sprs *[]vgfx.Spr,
	count int,
	sprCount int,
	clip vgeo.Box[float32],
) vgame.Status {
	countText := vtext.Itoa(count)
	sprCountText := vtext.Itoa(sprCount)
	w := max(len(countText), len(sprCountText))
	// to-do: do we even need PadInt()?
	this.SetText(
		// to-do: Ls and ct and st should have zero kern? do i want to join letters? ask AI to analyze existing.
		strings.Repeat(" ", w-len(countText)) + countText + " superballs\n" +
			strings.Repeat(" ", w-len(sprCountText)) + sprCountText + " sprs", // to-do: aggregate sprs from prior frame.
	)

	this.LayoutChars(font)
	// to-do: move to HUDEnt.Update()?
	const fillMargin = int16(2)
	fillXY := this.HUDEnt.XY(
		this.Layout.W+fillMargin*2, this.Layout.TrimAllForceH+fillMargin*2, clip,
	)
	this.TextEnt.XY = vgeo.XY[int16]{X: fillXY.X + fillMargin, Y: fillXY.Y + fillMargin}

	this.drawFill(sprs)

	return this.TextEnt.Update(font, sprs, clip)
}

func (this *EntStatusEnt) drawFill(sprs *[]vgfx.Spr) {
	const margin = int16(2)
	// to-do: this isn't great because we keep this fake state. we just want
	// sprs.
	this.Fill.XY = vgeo.NewXY(
		float32(this.TextEnt.XY.X-margin), float32(this.TextEnt.XY.Y-margin),
	)
	this.Fill.WH = vgeo.WH[uint16]{
		W: uint16(this.Layout.W + margin*2),
		H: uint16(this.Layout.TrimAllForceH + margin*2),
	}
	this.Fill.Update(sprs)
}
