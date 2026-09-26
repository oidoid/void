package game

import (
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
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
	veng.ButtonEnt
	Action ballAction
}

func NewZeroSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"0", SuperballActionClear, veng.ButtonTypeButton,
	)
}

func NewAddSomeSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"+", SuperballActionAddSome, veng.ButtonTypeButton,
	)
}

func NewAddManySuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"++", SuperballActionAddMany, veng.ButtonTypeButton,
	)
}

func NewHitSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"hit", SuperballActionHit, veng.ButtonTypeToggle,
	)
}

func NewBeepSuperballButtonEnt() *SuperballButtonEnt {
	return newSuperballButtonEnt(
		"beep", SuperballActionBeep, veng.ButtonTypeToggle,
	)
}

func newSuperballButtonEnt(
	label string, action ballAction, buttonType veng.ButtonType,
) *SuperballButtonEnt {
	this := SuperballButtonEnt{
		ButtonEnt: veng.ButtonEnt{
			NinePatchEnt: NewWidgetNinePatch(),
			Pals: veng.ButtonPals{
				Base:      tags.PalWidget,
				Focused:   tags.PalWidgetFocused,
				On:        tags.PalWidgetOn,
				FocusedOn: tags.PalWidgetFocusedOn,
			},
			TextPals: veng.ButtonPals{
				Base:      tags.PalText,
				Focused:   tags.PalText,
				On:        tags.PalTextLight,
				FocusedOn: tags.PalTextLight,
			},
			Anchor: veng.AnchorEnt{
				Dir:    vgeo.DirW,
				Margin: vgeo.NewXY(float32(UIButtonGap), 0),
			},
			AnchorMode: veng.ButtonAnchorRelative,
			MinW:       16,
			Type:       buttonType,
		},
		Action: action,
	}
	this.Text.SetText(label)
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return &this
}

func (this *SuperballButtonEnt) Update(gam *Game) veng.Status {
	layer := gam.Layer(gfx.LayerUI)
	loop := this.ButtonEnt.Update(
		gam.In(), &layer.Sprs, layer, gam.Font(), gam.Cursor().HitboxPhy(),
	)

	switch this.Action {
	case SuperballActionAddSome:
		if !this.On {
			break
		}
		ballsClip := gam.Layer(gfx.LayerSuperballs).Clip
		spawnCenter := vgeo.NewXY(
			(ballsClip.Min.X+ballsClip.Max.X)/2,
			(ballsClip.Min.Y+ballsClip.Max.Y)/2,
		)
		superballRadius := float32(
			gam.Atlas().Anims[int(tags.SuperballDefault)].W,
		) / 2
		spawnXY := vgeo.NewXY(
			spawnCenter.X-superballRadius,
			spawnCenter.Y-superballRadius,
		)
		n := min(4096, int(60_000*(gam.DeltaMs()/1000)))
		for range n {
			_ = gam.Superballs.Add(NewSuperballEnt(gam.Random, spawnXY))
		}
	case SuperballActionHit:
		gam.HitSuperballs = this.On
	case SuperballActionBeep:
		gam.BeepSuperballs = this.On
	}

	if this.IsOffStart() {
		switch this.Action {
		case SuperballActionClear:
			gam.Superballs.Clear()
		case SuperballActionAddMany:
			superballRadius := float32(
				gam.Atlas().Anims[int(tags.SuperballDefault)].W,
			) / 2
			tileW := float32(gam.BoardTileW())
			tileH := float32(gam.BoardTileH())
			board := vgeo.NewBox(
				tileW,
				tileH,
				float32(gam.Board().W)-tileW,
				float32(gam.Board().H)-tileH,
			)
			w := board.Max.X - board.Min.X - superballRadius*2
			h := board.Max.Y - board.Min.Y - superballRadius*2
			for range 1_000_000 {
				xy := vgeo.NewXY(
					board.Min.X+gam.Random()*w,
					board.Min.Y+gam.Random()*h,
				)
				_ = gam.Superballs.Add(NewSuperballEnt(gam.Random, xy))
			}
		}
	}
	return loop
}
