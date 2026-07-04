package ventdata

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: make fields private?
type DrawStatusEnt struct {
	HUDEnt
	TextEnt
	BgAnimID vatlas.AnimID
	Next     struct {
		// start of the current one-second FPS counting window in milliseconds.
		Start float64
		// frames counted in the current window.
		Frames int
	}
	// frames counted in the previous window.
	PrevFPS int
}

func NewDrawStatusEnt(
	bgAnimID vatlas.AnimID,
	anchor vgeo.Dir,
	margin vgeo.Border[int16],
	z vgfx.Z,
) DrawStatusEnt {
	this := DrawStatusEnt{BgAnimID: bgAnimID}
	this.Anchor = anchor
	this.Margin = margin
	this.Z = z
	return this
}

func (this *DrawStatusEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	nowMs float64,
	tick *vgame.Tick,
	clip vgeo.Box[float32],
) vgame.Status {
	this.Next.Frames++
	if nowMs-this.Next.Start >= 1000 {
		this.PrevFPS = this.Next.Frames
		this.Next.Frames = 0
		this.Next.Start = nowMs
	}
	text := vtext.Itoa(int(tick.DrawCount)) + "D " +
		vtext.FmtFloat2(tick.DeltaMs) + "u " +
		vtext.FmtFloat2(tick.DrawMs) + "d " +
		vtext.PadInt(this.PrevFPS, 3) + "\vfps" // \v forces consistent kerning.
	this.SetText(text)

	this.LayoutChars(font)
	this.TextEnt.XY = this.HUDEnt.XY(this.Layout.W, this.Layout.TrimLeadForceH, clip)

	this.DrawBackground(sprites)

	return this.TextEnt.Update(font, sprites, clip)
}

func (this *DrawStatusEnt) DrawBackground(sprites *[]vgfx.Sprite) {
	const margin = int16(1)
	*sprites = append(*sprites, vgfx.Sprite{
		XY:      vgeo.NewXY(float32(this.TextEnt.XY.X-margin), float32(this.TextEnt.XY.Y-margin)),
		AnimCel: this.BgAnimID.Cel(0),
		Z:       this.Z - 1,
		WH: vgeo.WH[uint16]{
			W: uint16(this.Layout.W + margin*2),
			H: uint16(this.Layout.TrimLeadForceH + margin*2),
		},
	})
}
