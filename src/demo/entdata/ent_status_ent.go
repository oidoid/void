package entdata

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type EntStatusEnt struct {
	ventdata.HUDEnt
	ventdata.TextEnt
}

func NewEntStatusEnt() EntStatusEnt {
	this := EntStatusEnt{}
	this.Anchor = vgeo.DirSW
	this.Margin = vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Z = vgfx.LayerTop
	return this
}

func (this *EntStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	canvasPhy vgeo.WH[uint16],
	count int,
	spriteCount int,
) vgame.Status {
	this.SetText(
		vtext.PadInt(count, 7) + " superballs\n" +
			vtext.PadInt(spriteCount, 7) + " sprites",
	)

	this.LayoutChars(font)
	this.XY = ventdata.HudXY(
		// to-do: canvasPhy is probably incorrect. should be same units of w/h.
		this.HUDEnt, this.Layout.W, this.Layout.TrimLeadForceH, canvasPhy,
	)

	this.drawBackground(sprites)

	return this.TextEnt.Update(font, sprites, vgeo.Box[float32]{})
}

func (this *EntStatusEnt) drawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(1)
	*sprites = append(*sprites, vgfx.Sprite{
		XY:     vgeo.NewXY(float32(this.XY.X-margin), float32(this.XY.Y-margin)),
		AnimID: assets.BackgroundKiwi,
		Z:      this.Z - 1,
		WH: vgeo.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimLeadForceH + margin*2),
		},
	})
}
