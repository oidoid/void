package game

import (
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type CamStatusEnt struct {
	veng.TextEnt
	Fill   veng.NinePatchEnt
	Anchor veng.AnchorEnt
}

func NewCamStatusEnt(fillTag vatlas.Tag, z vgfx.Z) CamStatusEnt {
	this := CamStatusEnt{}
	this.Fill = veng.NinePatchEnt{
		PatchByDir: [9]vgfx.Spr{
			vgeo.DirE:      {TagCel: fillTag.Cel(0)},
			vgeo.DirN:      {TagCel: fillTag.Cel(0)},
			vgeo.DirW:      {TagCel: fillTag.Cel(0)},
			vgeo.DirS:      {TagCel: fillTag.Cel(0)},
			vgeo.DirCenter: {TagCel: fillTag.Cel(0)},
		},
		CornerWH: vgeo.NewWH[uint16](1, 1),
	}
	this.Fill.SetZ(z - 1)
	this.Anchor = veng.AnchorEnt{
		Dir:    vgeo.DirSE,
		Margin: vgeo.NewXY[float32](4, 0),
	}
	this.Trim = vtext.TrimLead
	this.Z = z
	return this
}

func (this *CamStatusEnt) Update(gam *Game) veng.Status {
	font := gam.Font()
	layer := gam.Layer(this.Z.Layer())
	canvasPhy := *gam.CanvasPhy()
	tiles := gam.Layer(gfx.LayerTiles)
	cam := *gam.Cam()
	sprs := &layer.Sprs
	camLvl := tiles.PhyToLayerScale(cam)
	clip := layer.Clip
	text := "(" + vtext.FmtFloat(camLvl.X) + ", " + vtext.FmtFloat(camLvl.Y) + ") " +
		vtext.Itoa(int(canvasPhy.W)) + "x" + vtext.Itoa(int(canvasPhy.H))
	if gam.Fullscreen() {
		text += "f"
	}
	text += "@" + vtext.FmtFloat(tiles.ScaleOrDefault()) + "x"
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	const fillMargin = int16(2)
	w := this.Layout.W + fillMargin*2
	h := this.Layout.TrimAllForceH + fillMargin*2
	xy := this.Anchor.XY(float32(w), float32(h))
	if this.Anchor.Ref == nil {
		xy = this.Anchor.XYIn(float32(w), float32(h), clip)
	}
	this.TextEnt.XY = vgeo.NewXY(
		int16(xy.X)+fillMargin, int16(xy.Y)+fillMargin,
	)

	this.DrawFill(sprs)

	return this.TextEnt.Update(font, sprs, clip)
}

func (this *CamStatusEnt) DrawFill(sprs *[]vgfx.Spr) {
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
