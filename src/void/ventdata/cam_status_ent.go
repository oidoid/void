package ventdata

import (
	"strconv"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type CamStatusEnt struct {
	HUDEnt
	TextEnt
	BackgroundAnimID vatlas.AnimID
}

func NewCamStatusEnt(backgroundAnimID vatlas.AnimID) CamStatusEnt {
	ent := CamStatusEnt{BackgroundAnimID: backgroundAnimID}
	ent.Anchor = vmath.NE
	ent.Margin = 4
	return ent
}

func (this *CamStatusEnt) Update(
	font *vtext.Font,
	batch *vgfx.SpriteBatch,
	canvas vmath.WH[uint16],
	camX, camY float32,
	fullscreen bool,
) vgame.Status {
	this.Z = vgfx.LayerTop

	text := "(" + vtext.FmtFloat(camX) + ", " + vtext.FmtFloat(camY) + ") " +
		strconv.Itoa(int(canvas.W)) + "x" + strconv.Itoa(int(canvas.H))
	if fullscreen {
		text += "f"
	}
	// to-do: @<cam scale>.
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	this.XY = hudXY(this.HUDEnt, this.Layout.W, this.Layout.TrimmedH, canvas)

	this.DrawBackground(batch)

	return this.Draw(font, batch)
}

func (this *CamStatusEnt) DrawBackground(batch *vgfx.SpriteBatch) {
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
