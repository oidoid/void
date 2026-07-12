package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

type ballAction int8

const (
	SuperballActionClear   ballAction = iota // "0": clear all balls.
	SuperballActionAddSome                   // "+": add balls while held.
	SuperballActionAddMany                   // "++": add one million balls.
)

type SuperballButtonEnt struct {
	ventities.ButtonEnt
	Action ballAction
}

func NewZeroSuperballButtonEnt() SuperballButtonEnt {
	this := newSuperballButtonEnt("0", SuperballActionClear)
	this.ClipAnchor = ventities.HUDEnt{
		Anchor: vgeo.DirNW, Margin: vgeo.Border[int16]{N: 4, W: 4},
	}
	this.AnchorMode = ventities.ButtonAnchorHUD
	return this
}

func NewAddSomeSuperballButtonEnt() SuperballButtonEnt {
	this := newSuperballButtonEnt("+", SuperballActionAddSome)
	this.Anchor = ventities.AnchorEnt{
		Dir: vgeo.DirE, Margin: vgeo.NewXY[float32](4, 0),
	}
	this.AnchorMode = ventities.ButtonAnchorRelative
	return this
}

func NewAddManySuperballButtonEnt() SuperballButtonEnt {
	this := newSuperballButtonEnt("++", SuperballActionAddMany)
	this.Anchor = ventities.AnchorEnt{
		Dir: vgeo.DirE, Margin: vgeo.NewXY[float32](4, 0),
	}
	this.AnchorMode = ventities.ButtonAnchorRelative
	return this
}

func newSuperballButtonEnt(label string, action ballAction) SuperballButtonEnt {
	this := SuperballButtonEnt{
		ButtonEnt: ventities.ButtonEnt{
			NinePatchEnt: ventities.NinePatchEnt{
				PatchByDir: [9]vgfx.Sprite{
					vgeo.DirCenter: {AnimCel: assets.PaletteBlue.Cel(0)},
				},
				CornerWH: vgeo.WH[uint16]{W: 1, H: 1},
			},
			UnfocusedBorder: assets.PaletteBlack,
			FocusedBorder:   assets.PaletteBubblegum,
			Anchor: ventities.AnchorEnt{
				Dir: vgeo.DirE, Margin: vgeo.NewXY[float32](4, 0),
			},
			AnchorMode: ventities.ButtonAnchorRelative,
			MinW:       16,
		},
		Action: action,
	}
	this.Text.Text = label
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return this
}

func (this *SuperballButtonEnt) Update(
	in *vin.In,
	sprites *[]vgfx.Sprite,
	layer *vgfx.LayerConfig,
	font *vtext.Font,
	balls *vvec.Vec[BallEnt],
	spawnCenter vgeo.XY[float32],
	deltaMs float64,
	lvl vgeo.Box[float32],
	rnd func() float32,
	ballRadius float32,
) vgame.Status {
	loop := this.ButtonEnt.Update(in, sprites, layer, font)

	if this.Action == SuperballActionAddSome && this.On {
		spawnXY := vgeo.NewXY(spawnCenter.X-ballRadius, spawnCenter.Y-ballRadius)
		n := min(3000, int(60_000*(deltaMs/1000)))
		for range n {
			_ = balls.Add(NewBallEnt(rnd, spawnXY))
		}
	}

	if this.OffStart() {
		switch this.Action {
		case SuperballActionClear:
			balls.Clear()
		case SuperballActionAddMany:
			w := lvl.Max.X - lvl.Min.X - ballRadius*2
			h := lvl.Max.Y - lvl.Min.Y - ballRadius*2
			for range 1_000_000 {
				xy := vgeo.NewXY(lvl.Min.X+rnd()*w, lvl.Min.Y+rnd()*h)
				_ = balls.Add(NewBallEnt(rnd, xy))
			}
		}
	}
	return loop
}
