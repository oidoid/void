package entities

import (
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: make fields private?
type DrawStatusEnt struct {
	ventities.HUDEnt
	ventities.TextEnt
	Fill ventities.NinePatchEnt
	Next struct {
		// start of the current one-second FPS counting window in milliseconds.
		Start float64
		// frames counted in the current window.
		Frames int
	}
	// frames counted in the previous window.
	PrevFPS int
}

func NewDrawStatusEnt(
	fillTag vatlas.Tag,
	anchor vgeo.Dir,
	margin vgeo.Edge[int16],
) DrawStatusEnt {
	this := DrawStatusEnt{}
	this.Fill = ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Spr{
			vgeo.DirE:      {TagCel: fillTag.Cel(0)},
			vgeo.DirN:      {TagCel: fillTag.Cel(0)},
			vgeo.DirW:      {TagCel: fillTag.Cel(0)},
			vgeo.DirS:      {TagCel: fillTag.Cel(0)},
			vgeo.DirCenter: {TagCel: fillTag.Cel(0)},
		},
		CornerWH: vgeo.NewWH[uint16](1, 1),
	}
	this.Fill.SetZ(gfx.ZUIFill)
	this.Anchor = anchor
	this.Margin = margin
	this.Z = gfx.ZUIWidget
	return this
}

func (this *DrawStatusEnt) Update(gam game.Game) vgame.Status {
	font := gam.Font()
	layer := gam.Layer(this.Z.Layer())
	sprs := &layer.Sprs
	nowMillis := gam.NowMillis()
	tick := gam.Tick()
	clip := layer.Clip
	this.Next.Frames++
	if nowMillis-this.Next.Start >= 1000 {
		this.PrevFPS = this.Next.Frames
		this.Next.Frames = 0
		this.Next.Start = nowMillis
	}
	text := vtext.Itoa(int(tick.DrawCount)+1) + "d " +
		vtext.FmtFloat2(tick.UpdateMs) + "ms " +
		vtext.PadInt(this.PrevFPS, 3, " ") + "\tfps" // \t forces 1px kerning.
	this.SetText(text)

	this.LayoutChars(font)
	const fillMargin = int16(2)
	fillXY := this.HUDEnt.XY(
		this.Layout.W+fillMargin*2, this.Layout.TrimAllForceH+fillMargin*2, clip,
	)
	this.TextEnt.XY = vgeo.NewXY(fillXY.X+fillMargin, fillXY.Y+fillMargin)

	this.DrawFill(sprs)

	return this.TextEnt.Update(font, sprs, clip)
}

func (this *DrawStatusEnt) DrawFill(sprs *[]vgfx.Spr) {
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
