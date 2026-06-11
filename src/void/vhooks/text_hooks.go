package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

var zeroChar = vmath.Box[int16]{}

func UpdateTexts[Game vgame.Game](
	ents *vvec.Vec[ventdata.TextEnt],
	gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	vals := ents.Vals()
	loop := vgame.Pause
	font := gam.Font()
	for i := range vals {
		loop |= updateText(&vals[i], font, &batch)
	}
	gam.EndDraw(batch)
	return loop
}

func updateText(
	ent *ventdata.TextEnt,
	font *vtext.Font,
	batch *vgfx.SpriteBatch,
) vgame.Status {
	loop := vgame.Pause
	if ent.Layout.Chars == nil {
		layoutText(ent, font)
		loop |= vgame.Loop
	}
	for i, ch := range []rune(ent.Text) {
		chBox := ent.Layout.Chars[i]
		if chBox == zeroChar {
			// to-do: better to just draw instead of testing every char?
			continue
		}
		xy := vmath.NewXY(
			float32(chBox.Min.X+ent.XY.X), float32(chBox.Min.Y+ent.XY.Y),
		)
		if !ent.Z.UI() {
			if xy.Y > batch.Viewport.Max.Y {
				break
			}
			if !batch.Viewport.HitsXY(xy) {
				continue
			}
		}
		n := len(batch.Sprites)
		batch.Sprites = batch.Sprites[:n+1]
		batch.Sprites[n] = vgfx.Sprite{XY: xy, AnimID: font.AnimID(ch), Z: ent.Z}
	}
	return loop
}

func layoutText(ent *ventdata.TextEnt, font *vtext.Font) {
	if ent.Layout.Chars != nil {
		return
	}
	ent.Layout = vtext.LayoutText(vtext.TextLayoutOpts{
		Font:  font,
		Scale: 1,
		Text:  ent.Text,
	})
}

// update text and invalidate layout if changed.
func setText(ent *ventdata.TextEnt, text string) {
	if ent.Text == text {
		return
	}
	ent.Text = text
	ent.Layout.Chars = nil
}
