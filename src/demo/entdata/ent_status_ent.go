package entdata

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type EntStatusEnt struct {
	ventdata.HUDEnt
	ventdata.TextEnt
}

func NewEntStatusEnt() EntStatusEnt {
	this := EntStatusEnt{}
	this.Anchor = vmath.SW
	this.Margin = vmath.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Trim = vtext.TrimLead
	this.Z = vgfx.LayerTop
	return this
}

func (this *EntStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	canvas vmath.WH[uint16],
	count int,
) vgame.Status {
	this.SetText(vtext.PadInt(count, 7) + " superballs")

	this.LayoutChars(font)
	this.XY = ventdata.HudXY(
		this.HUDEnt, this.Layout.W, this.Layout.TrimH, canvas,
	)

	this.drawBackground(sprites)

	return this.TextEnt.Update(font, sprites, vmath.Box[float32]{})
}

func (this *EntStatusEnt) drawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(1)
	*sprites = append(*sprites, vgfx.Sprite{
		XY:     vmath.NewXY(float32(this.XY.X-margin), float32(this.XY.Y-margin)),
		AnimID: assets.BackgroundKiwi,
		Z:      this.Z - 1,
		WH: vmath.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimH + margin*2),
		},
	})
}

// to-do: log number of frames rendered.
