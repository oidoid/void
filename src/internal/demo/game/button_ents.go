package game

import (
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

const buttonMinW = 16

func NewDrawToggleButton(gam *Game) *vengine.ButtonEnt {
	this := newButtonEnt("draw", vengine.ButtonTypeToggle)
	this.ClipAnchor = vengine.HUDEnt{
		Anchor: vgeo.DirNE,
		Margin: vgeo.Edge[int16]{E: 4, N: 4},
	}
	this.AnchorMode = vengine.ButtonAnchorHUD
	this.OnUpdate = func(ent *vengine.ButtonEnt) {
		ent.On = gam.DrawAlways()
	}
	this.OnClick = func(ent *vengine.ButtonEnt) {
		gam.SetDrawAlways(ent.On)
	}
	return this
}

func NewDrawOnBlurToggle(gam *Game) *vengine.ButtonEnt {
	this := newButtonEnt("blur", vengine.ButtonTypeToggle)
	this.OnUpdate = func(ent *vengine.ButtonEnt) {
		ent.On = gam.DrawOnBlur()
	}
	this.OnClick = func(ent *vengine.ButtonEnt) {
		gam.SetDrawOnBlur(ent.On)
	}
	return this
}

func NewContextLossButton(gam *Game) *vengine.ButtonEnt {
	this := newButtonEnt("!gl", vengine.ButtonTypeButton)
	this.OnClick = func(*vengine.ButtonEnt) {
		gam.ReqContextLoss()
	}
	return this
}

func NewScreenshotButton(gam *Game) *vengine.ButtonEnt {
	this := newButtonEnt("pic", vengine.ButtonTypeButton)
	this.OnClick = func(*vengine.ButtonEnt) {
		gam.ReqScreenshot()
	}
	return this
}

func NewFullscreenToggle(gam *Game) *vengine.ButtonEnt {
	this := newButtonEnt("window", vengine.ButtonTypeToggle)
	this.OnUpdate = func(ent *vengine.ButtonEnt) {
		ent.On = !gam.FullscreenEnabled()
	}
	this.OnClick = func(ent *vengine.ButtonEnt) {
		if ent.On {
			gam.ReqFullscreen(vengine.FullscreenReqExit)
		} else {
			gam.ReqFullscreen(vengine.FullscreenReqEnter)
		}
	}
	return this
}

func NewCursorKeyToggle(cursor *vengine.CursorEnt) *vengine.ButtonEnt {
	this := newButtonEnt("kbd", vengine.ButtonTypeToggle)
	this.OnUpdate = func(ent *vengine.ButtonEnt) {
		ent.On = cursor.KbdEnabled
	}
	this.OnClick = func(ent *vengine.ButtonEnt) {
		cursor.KbdEnabled = ent.On
	}
	return this
}

func newButtonEnt(
	label string,
	buttonType vengine.ButtonType,
) *vengine.ButtonEnt {
	this := vengine.ButtonEnt{
		NinePatchEnt: NewWidgetNinePatch(),
		Pals: vengine.ButtonPals{
			Base:      tags.PalWidget,
			Focused:   tags.PalWidgetFocused,
			On:        tags.PalWidgetOn,
			FocusedOn: tags.PalWidgetFocusedOn,
		},
		TextPals: vengine.ButtonPals{
			Base:      tags.PalText,
			Focused:   tags.PalText,
			On:        tags.PalTextLight,
			FocusedOn: tags.PalTextLight,
		},
		Anchor: vengine.AnchorEnt{
			Dir:    vgeo.DirW,
			Margin: vgeo.NewXY(float32(UIButtonGap), float32(0)),
		},
		AnchorMode: vengine.ButtonAnchorRelative,
		MinW:       buttonMinW,
		Type:       buttonType,
	}
	this.Text.SetText(label)
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return &this
}

func UpdateButtons(
	vec *vvec.Vec[*vengine.ButtonEnt],
	gam *Game,
) vengine.Status {
	in := gam.In()
	cursorPhy := gam.Cursor().HitboxPhy()
	ents := vec.Vals()
	loop := vengine.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Z().Layer())
		loop |= ent.Update(
			in, &layer.Sprs, layer, gam.Font(), cursorPhy,
		)
	}
	return loop
}
