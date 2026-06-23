package ventdata

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: hide text?
type TextEnt struct {
	Text   string
	Layout vtext.TextLayout // nil `Layout.Chars` to force relayout.
	XY     vgeo.XY[int16]
	Z      vgfx.Layer
	Trim   vtext.Trim
}

var zeroChar = vgeo.Box[int16]{}

func (this *TextEnt) Update(
	font *vtext.Font, sprites *[]vgfx.Sprite, viewport vgeo.Box[float32],
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
		if !this.Z.UI() {
			if xy.Y > viewport.Max.Y {
				break
			}
			if !viewport.HitsXY(xy) {
				continue
			}
		}
		*sprites = append(
			*sprites, vgfx.Sprite{XY: xy, AnimID: font.AnimID(ch), Z: this.Z},
		)
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

func (this *TextEnt) LayoutChars(font *vtext.Font) {
	if this.Layout.Chars != nil {
		return
	}
	this.Layout = vtext.LayoutText(vtext.TextLayoutOpts{
		Font:  font,
		Scale: 1,
		Text:  this.Text,
	})
}
