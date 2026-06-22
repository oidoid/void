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
	this := CamStatusEnt{BackgroundAnimID: backgroundAnimID}
	this.Anchor = vmath.DirNE
	this.Margin = vmath.Border[int16]{N: 4, E: 4, S: 4, W: 4}
	this.Trim = vtext.TrimLead
	this.Z = vgfx.LayerTop
	return this
}

func (this *CamStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	canvas vmath.WH[uint16],
	camX, camY float32,
	fullscreen bool,
) vgame.Status {
	text := "(" + vtext.FmtFloat(camX) + ", " + vtext.FmtFloat(camY) + ") " +
		strconv.Itoa(int(canvas.W)) + "x" + strconv.Itoa(int(canvas.H))
	if fullscreen {
		text += "f"
	}
	// to-do: @<cam scale>.
	this.SetText(text)

	this.LayoutChars(font)
	// to-do: if invalid / cam.invalid / return value from LayoutChars().
	this.XY = HudXY(this.HUDEnt, this.Layout.W, this.Layout.TrimH, canvas)

	this.DrawBackground(sprites)

	return this.TextEnt.Update(font, sprites, vmath.Box[float32]{})
}

func (this *CamStatusEnt) DrawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(1)
	*sprites = append(*sprites, vgfx.Sprite{
		XY:     vmath.NewXY(float32(this.XY.X-margin), float32(this.XY.Y-margin)),
		AnimID: this.BackgroundAnimID,
		Z:      this.Z - 1,
		WH: vmath.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimH + margin*2),
		},
	})
}
