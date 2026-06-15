package ventdata

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type FPSEnt struct {
	HUDEnt
	TextEnt
	BackgroundAnimID vatlas.AnimID
	Next             struct {
		// start of the current one-second FPS counting window in milliseconds.
		Start float64
		// frames counted in the current window.
		Frames int
	}
	// Frames counted in the previous window.
	PrevFPS int
}

func NewFPSEnt(backgroundAnimID vatlas.AnimID) FPSEnt {
	ent := FPSEnt{BackgroundAnimID: backgroundAnimID}
	ent.Trim = vtext.TrimLeading
	ent.Anchor = vmath.SE
	ent.Margin = 4
	return ent
}

func (this *FPSEnt) Update(
	font *vtext.Font,
	batch *vgfx.SpriteBatch,
	nowMs float64,
	tick *vgame.Tick,
	canvas vmath.WH[uint16],
) vgame.Status {
	this.Z = vgfx.LayerTop

	this.Next.Frames++
	if nowMs-this.Next.Start >= 1000 {
		this.PrevFPS = this.Next.Frames
		this.Next.Frames = 0
		this.Next.Start = nowMs
	}
	text := vtext.FmtFloat2(tick.DeltaMs) + "u " +
		vtext.FmtFloat2(tick.DrawMs) + "d " +
		vtext.PadInt(this.PrevFPS, 3) + "\vfps" // \v forces consistent kerning.
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	this.XY = hudXY(this.HUDEnt, this.Layout.W, this.Layout.TrimmedH, canvas)

	this.DrawBackground(batch)

	return this.Draw(font, batch)
}

func (this *FPSEnt) DrawBackground(batch *vgfx.SpriteBatch) {
	const margin = int16(1)
	n := len(batch.Sprites)
	batch.Sprites = batch.Sprites[:n+1]
	batch.Sprites[n] = vgfx.Sprite{
		XY:     vmath.NewXY(float32(this.XY.X-margin), float32(this.XY.Y-margin)),
		AnimID: this.BackgroundAnimID,
		Z:      vgfx.LayerTop - 1,
		WH: vmath.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimmedH + margin*2),
		},
	}
}
