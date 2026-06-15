package ventdata

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: hide text?
type TextEnt struct {
	Text   string
	Layout vtext.TextLayout // nil `Layout.Chars` to force relayout.
	XY     vmath.XY[int16]
	Z      vgfx.Layer
	Trim   vtext.Trim
}

var zeroChar = vmath.Box[int16]{}

func (this *TextEnt) Draw(font *vtext.Font, batch *vgfx.SpriteBatch) vgame.Status {
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
		xy := vmath.NewXY(
			float32(chBox.Min.X+this.XY.X), float32(chBox.Min.Y+this.XY.Y),
		)
		if !this.Z.UI() {
			if xy.Y > batch.Viewport.Max.Y {
				break
			}
			if !batch.Viewport.HitsXY(xy) {
				continue
			}
		}
		n := len(batch.Sprites)
		batch.Sprites = batch.Sprites[:n+1]
		batch.Sprites[n] = vgfx.Sprite{XY: xy, AnimID: font.AnimID(ch), Z: this.Z}
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
