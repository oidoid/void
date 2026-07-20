package entities

import (
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
	Bg   ventities.NinePatchEnt
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
	bgAnimID vatlas.AnimID,
	anchor vgeo.Dir,
	margin vgeo.Border[int16],
) DrawStatusEnt {
	this := DrawStatusEnt{}
	this.Bg = ventities.NinePatchEnt{
		PatchByDir: [9]vgfx.Sprite{
			vgeo.DirN:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirE:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirS:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirW:      {AnimCel: bgAnimID.Cel(0)},
			vgeo.DirCenter: {AnimCel: bgAnimID.Cel(0)},
		},
		CornerWH: vgeo.WH[uint16]{W: 1, H: 1},
	}
	this.Bg.SetZ(gfx.ZUIBackground)
	this.Anchor = anchor
	this.Margin = margin
	this.Z = gfx.ZUIWidget
	return this
}

func (this *DrawStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	nowMs float64,
	tick *vgame.Tick,
	clip vgeo.Box[float32],
) vgame.Status {
	this.Next.Frames++
	if nowMs-this.Next.Start >= 1000 {
		this.PrevFPS = this.Next.Frames
		this.Next.Frames = 0
		this.Next.Start = nowMs
	}
	text := vtext.Itoa(int(tick.DrawCount)+1) + "d " +
		vtext.FmtFloat2(tick.UpdateMs) + "u " +
		vtext.PadInt(this.PrevFPS, 3, " ") + "\tfps" // \t forces 1px kerning.
	this.SetText(text)

	this.LayoutChars(font)
	const bgMargin = int16(2)
	bgXY := this.HUDEnt.XY(
		this.Layout.W+bgMargin*2, this.Layout.TrimAllForceH+bgMargin*2, clip,
	)
	this.TextEnt.XY = vgeo.XY[int16]{X: bgXY.X + bgMargin, Y: bgXY.Y + bgMargin}

	this.DrawBackground(sprites)

	return this.TextEnt.Update(font, sprites, clip)
}

func (this *DrawStatusEnt) DrawBackground(sprites *[]vgfx.Sprite) {
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
