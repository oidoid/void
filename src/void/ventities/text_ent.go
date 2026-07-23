package ventities

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: hide text?
type TextEnt struct {
	Text      string
	Layout    vtext.TextLayout // nil `Layout.Chars` to force relayout.
	XY        vgeo.XY[int16]
	Z         vgfx.Z
	Trim      vtext.Trim
	textScale uint8
}

var zeroChar = vgeo.Box[int16]{}

func (this *TextEnt) Update(
	font *vtext.Font, sprites *[]vgfx.Sprite, clip vgeo.Box[float32],
) vgame.Status {
	loop := vgame.Pause
	if this.Layout.Chars == nil {
		this.LayoutChars(font)
		loop |= vgame.Loop
	}
	for i, ch := range []rune(this.Text) {
		chBox := this.Layout.Chars[i]
		if chBox == zeroChar {
			// to-do: better to just draw instead of testing every char?
			continue
		}
		xy := vgeo.NewXY(
			float32(chBox.Min.X+this.XY.X), float32(chBox.Min.Y+this.XY.Y),
		)
		if xy.Y > clip.Max.Y {
			break
		}
		if !clip.HitsXY(xy) {
			continue
		}
		sprite := vgfx.Sprite{AnimCel: font.AnimID(ch).Cel(0), XY: xy, Z: this.Z}
		scale := this.scale()
		sprite.WH = vgeo.WH[uint16]{
			W: uint16(font.CellW) * uint16(scale),
			H: uint16(font.CellH) * uint16(scale),
		}
		sprite.SetStretch(true)
		*sprites = append(*sprites, sprite)
	}
	return loop
}

// invalidates layout when text changes.
func (this *TextEnt) SetText(text string) {
	if this.Text == text {
		return
	}
	this.Text = text
	this.Layout.Chars = nil
}

func (this *TextEnt) SetScale(scale uint8) {
	if this.textScale == scale {
		return
	}
	this.textScale = scale
	this.Layout.Chars = nil
}

func (this *TextEnt) LayoutChars(font *vtext.Font) {
	if this.Layout.Chars != nil {
		return
	}
	this.Layout = vtext.LayoutText(vtext.TextLayoutOpts{
		Font:  font,
		Scale: this.scale(),
		Text:  this.Text,
	})
}

func (this *TextEnt) scale() uint8 {
	if this.textScale == 0 {
		return 1
	}
	return this.textScale
}
