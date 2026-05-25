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
	ents *vvec.Vec[ventdata.TextEnt], gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	vals := ents.Vals()
	loop := vgame.Pause
	font := gam.Font()
	for i := range vals {
		loop |= drawTextEnt(&vals[i], font, &batch)
	}
	gam.EndDraw(batch)
	return loop
}

// update text and invalidate layout.
func SetText(ent *ventdata.TextEnt, text string) {
	ent.Text = text
	ent.Layout.Chars = nil
}

func MoveTo(ent *ventdata.TextEnt, x, y int16) {
	dx := x - ent.Layout.Min.X
	dy := y - ent.Layout.Min.Y
	ent.Layout.Min.X += dx
	ent.Layout.Min.Y += dy
	ent.Layout.Max.X += dx
	ent.Layout.Max.Y += dy
	ent.Layout.Cursor.X += dx
	ent.Layout.Cursor.Y += dy
	for i := range ent.Layout.Chars {
		ch := &ent.Layout.Chars[i]
		ch.Min.X += dx
		ch.Min.Y += dy
		ch.Max.X += dx
		ch.Max.Y += dy
	}
}

func drawTextEnt(
	ent *ventdata.TextEnt, font *vtext.Font, batch *vgfx.SpriteBatch,
) vgame.Status {
	loop := vgame.Pause
	if ent.Layout.Chars == nil {
		ent.Layout = vtext.LayoutText(vtext.TextLayoutOpts{
			Font:  font,
			Scale: 1,
			XY:    ent.Layout.Min,
			Text:  ent.Text,
		})
		loop |= vgame.Loop
	}
	i := 0
	for _, ch := range ent.Text {
		chBox := ent.Layout.Chars[i]
		i++
		if chBox == zeroChar {
			continue
		}
		xy := vmath.NewXY(float32(chBox.Min.X), float32(chBox.Min.Y))
		if xy.Y > batch.Viewport.Max.Y {
			break
		}
		if batch.Viewport.HitsXY(xy) {
			n := len(batch.Sprites)
			batch.Sprites = batch.Sprites[:n+1]
			batch.Sprites[n] = vgfx.Sprite{XY: xy, AnimID: font.AnimID(ch)}
		}
	}
	return loop
}
