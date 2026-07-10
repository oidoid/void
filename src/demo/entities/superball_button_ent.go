package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

const buttonW = 19
const buttonH = 12

type SuperballButtonEnt struct {
	ventities.ButtonEnt
	Label ventities.TextEnt
}

func NewSuperballButtonEnt() SuperballButtonEnt {
	this := SuperballButtonEnt{
		ButtonEnt: ventities.ButtonEnt{
			NinePatchEnt: ventities.NinePatchEnt{
				XY:        vgeo.NewXY[float32](4, 4),
				WH:        vgeo.WH[uint16]{W: buttonW, H: buttonH},
				Z:         gfx.ZUIWidget,
				AnimByDir: [9]vatlas.AnimID{vgeo.DirCenter: assets.BackgroundKiwi},
				CornerWH:  vgeo.WH[uint16]{W: 1, H: 1},
			},
			UnfocusedBorder: assets.BackgroundBlueberry,
			FocusedBorder:   assets.BackgroundBubblegum,
		},
	}
	this.Label.Text = "+"
	this.Label.Z = gfx.ZUIText
	return this
}

func (this *SuperballButtonEnt) Update(
	sprites *[]vgfx.Sprite,
	in *vin.In,
	font *vtext.Font,
	layer *vgfx.LayerConfig,
	balls *vvec.Vec[BallEnt],
	cam vgeo.XY[float32],
	deltaMs float64,
	rnd func() float32,
	ballRadius float32,
) vgame.Status {
	loop := this.ButtonEnt.Update(in, sprites, layer)

	this.Label.LayoutChars(font)
	this.Label.XY = vgeo.XY[int16]{
		X: int16(this.ButtonEnt.XY.X) + (buttonW-this.Label.Layout.W)/2,
		Y: int16(this.ButtonEnt.XY.Y) + (buttonH-this.Label.Layout.TrimLeadForceH)/2,
	}
	this.Label.Update(font, sprites, layer.Clip)

	if this.ButtonEnt.On {
		spawnXY := vgeo.NewXY(cam.X-ballRadius, cam.Y-ballRadius)
		n := min(3000, int(60_000*(deltaMs/1000)))
		for range n {
			_ = balls.Add(NewBallEnt(rnd, spawnXY))
		}
	}
	return loop
}
