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
	SuperballActionClear ballAction = iota
	SuperballActionAddSome
	SuperballActionAddMany
	SuperballActionHit
	SuperballActionBeep
)

type SuperballButtonEnt struct {
	ventities.ButtonEnt
	Action ballAction
}

func NewZeroSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"0", SuperballActionClear, ventities.ButtonTypeButton,
	)
}

func NewAddSomeSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"+", SuperballActionAddSome, ventities.ButtonTypeButton,
	)
}

func NewAddManySuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"++", SuperballActionAddMany, ventities.ButtonTypeButton,
	)
}

func NewHitSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"hit", SuperballActionHit, ventities.ButtonTypeToggle,
	)
}

func NewBeepSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"beep", SuperballActionBeep, ventities.ButtonTypeToggle,
	)
}

func newSuperballButtonEnt(
	label string, action ballAction, buttonType ventities.ButtonType,
) *SuperballButtonEnt {
	this := SuperballButtonEnt{
		ButtonEnt: ventities.ButtonEnt{
			NinePatchEnt: newWidgetNinePatch(),
			Pals: ventities.ButtonPals{
				Base:      assets.PalWidget,
				Focused:   assets.PalWidgetFocused,
				On:        assets.PalWidgetOn,
				FocusedOn: assets.PalWidgetFocusedOn,
			},
			TextPals: ventities.ButtonPals{
				Base:      assets.PalText,
				Focused:   assets.PalText,
				On:        assets.PalTextLight,
				FocusedOn: assets.PalTextLight,
			},
			Anchor: ventities.AnchorEnt{
				Dir:    vgeo.DirW,
				Margin: vgeo.NewXY(float32(uiButtonGap), 0),
			},
			AnchorMode: ventities.ButtonAnchorRelative,
			MinW:       16,
			Type:       buttonType,
		},
		Action: action,
	}
	this.Text.Text = label
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return &this
}

func (this *SuperballButtonEnt) Update(
	in *vin.In,
	sprs *[]vgfx.Spr,
	layer *vgfx.LayerConfig,
	font *vtext.Font,
	superballs *vvec.Vec[SuperballEnt],
	spawnCenter vgeo.XY[float32],
	deltaMs float64,
	lvl vgeo.Box[float32],
	rnd func() float32,
	superballRadius float32,
	hit *bool,
	beep *bool,
) vgame.Status {
	loop := this.ButtonEnt.Update(in, sprs, layer, font)

	if this.Action == SuperballActionAddSome && this.On {
		spawnXY := vgeo.NewXY(
			spawnCenter.X-superballRadius,
			spawnCenter.Y-superballRadius,
		)
		n := min(4096, int(60_000*(deltaMs/1000)))
		for range n {
			_ = superballs.Add(NewSuperballEnt(rnd, spawnXY))
		}
	}
	switch this.Action {
	case SuperballActionHit:
		*hit = this.On
	case SuperballActionBeep:
		*beep = this.On
	}

	if this.IsOffStart() {
		switch this.Action {
		case SuperballActionClear:
			superballs.Clear()
		case SuperballActionAddMany:
			w := lvl.Max.X - lvl.Min.X - superballRadius*2
			h := lvl.Max.Y - lvl.Min.Y - superballRadius*2
			for range 1_000_000 {
				xy := vgeo.NewXY(lvl.Min.X+rnd()*w, lvl.Min.Y+rnd()*h)
				_ = superballs.Add(NewSuperballEnt(rnd, xy))
			}
		}
	}
	return loop
}
