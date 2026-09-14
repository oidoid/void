package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
)

const buttonMinW = 16

func NewDrawToggleButton(gam *engine.Eng) *ventities.ButtonEnt {
	this := newButtonEnt("draw", ventities.ButtonTypeToggle)
	this.ClipAnchor = ventities.HUDEnt{
		Anchor: vgeo.DirNE,
		Margin: vgeo.Edge[int16]{E: 4, N: 4},
	}
	this.AnchorMode = ventities.ButtonAnchorHUD
	this.OnUpdate = func(ent *ventities.ButtonEnt) {
		ent.On = gam.DrawAlways()
	}
	this.OnClick = func(ent *ventities.ButtonEnt) {
		gam.SetDrawAlways(ent.On)
	}
	return this
}

func NewDrawOnBlurToggle(gam *engine.Eng) *ventities.ButtonEnt {
	this := newButtonEnt("blur", ventities.ButtonTypeToggle)
	this.OnUpdate = func(ent *ventities.ButtonEnt) {
		ent.On = gam.DrawOnBlur()
	}
	this.OnClick = func(ent *ventities.ButtonEnt) {
		gam.SetDrawOnBlur(ent.On)
	}
	return this
}

func NewContextLossButton(gam *engine.Eng) *ventities.ButtonEnt {
	this := newButtonEnt("!gl", ventities.ButtonTypeButton)
	this.OnClick = func(*ventities.ButtonEnt) {
		gam.ReqContextLoss()
	}
	return this
}

func NewScreenshotButton(gam *engine.Eng) *ventities.ButtonEnt {
	this := newButtonEnt("pic", ventities.ButtonTypeButton)
	this.OnClick = func(*ventities.ButtonEnt) {
		gam.ReqScreenshot()
	}
	return this
}

func NewFullscreenToggle(gam *engine.Eng) *ventities.ButtonEnt {
	this := newButtonEnt("window", ventities.ButtonTypeToggle)
	this.OnUpdate = func(ent *ventities.ButtonEnt) {
		ent.On = !gam.FullscreenEnabled()
	}
	this.OnClick = func(ent *ventities.ButtonEnt) {
		if ent.On {
			gam.ReqFullscreen(vengine.FullscreenReqExit)
		} else {
			gam.ReqFullscreen(vengine.FullscreenReqEnter)
		}
	}
	return this
}

func NewCursorKeyToggle(cursor *ventities.CursorEnt) *ventities.ButtonEnt {
	this := newButtonEnt("kbd", ventities.ButtonTypeToggle)
	this.OnUpdate = func(ent *ventities.ButtonEnt) {
		ent.On = cursor.KbdEnabled
	}
	this.OnClick = func(ent *ventities.ButtonEnt) {
		cursor.KbdEnabled = ent.On
	}
	return this
}

func newButtonEnt(
	label string,
	buttonType ventities.ButtonType,
) *ventities.ButtonEnt {
	this := ventities.ButtonEnt{
		NinePatchEnt: entities.NewWidgetNinePatch(),
		Pals: ventities.ButtonPals{
			Base:      tags.PalWidget,
			Focused:   tags.PalWidgetFocused,
			On:        tags.PalWidgetOn,
			FocusedOn: tags.PalWidgetFocusedOn,
		},
		TextPals: ventities.ButtonPals{
			Base:      tags.PalText,
			Focused:   tags.PalText,
			On:        tags.PalTextLight,
			FocusedOn: tags.PalTextLight,
		},
		Anchor: ventities.AnchorEnt{
			Dir:    vgeo.DirW,
			Margin: vgeo.NewXY(float32(entities.UIButtonGap), float32(0)),
		},
		AnchorMode: ventities.ButtonAnchorRelative,
		MinW:       buttonMinW,
		Type:       buttonType,
	}
	this.Text.Text = label
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return &this
}
