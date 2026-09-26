package game

import (
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

const buttonMinW = 16

func NewDrawToggleButton(gam *Game) *veng.ButtonEnt {
	this := newButtonEnt("draw", veng.ButtonTypeToggle)
	this.ClipAnchor = veng.HUDEnt{
		Anchor: vgeo.DirNE,
		Margin: vgeo.Edge[int16]{E: 4, N: 4},
	}
	this.AnchorMode = veng.ButtonAnchorHUD
	this.OnUpdate = func(ent *veng.ButtonEnt) {
		ent.On = gam.DrawAlways()
	}
	this.OnClick = func(ent *veng.ButtonEnt) {
		gam.SetDrawAlways(ent.On)
	}
	return this
}

func NewDrawOnBlurToggle(gam *Game) *veng.ButtonEnt {
	this := newButtonEnt("blur", veng.ButtonTypeToggle)
	this.OnUpdate = func(ent *veng.ButtonEnt) {
		ent.On = gam.DrawOnBlur()
	}
	this.OnClick = func(ent *veng.ButtonEnt) {
		gam.SetDrawOnBlur(ent.On)
	}
	return this
}

func NewContextLossButton(gam *Game) *veng.ButtonEnt {
	this := newButtonEnt("!gl", veng.ButtonTypeButton)
	this.OnClick = func(*veng.ButtonEnt) {
		gam.ReqContextLoss()
	}
	return this
}

func NewScreenshotButton(gam *Game) *veng.ButtonEnt {
	this := newButtonEnt("pic", veng.ButtonTypeButton)
	this.OnClick = func(*veng.ButtonEnt) {
		gam.ReqScreenshot()
	}
	return this
}

func NewFullscreenToggle(gam *Game) *veng.ButtonEnt {
	this := newButtonEnt("window", veng.ButtonTypeToggle)
	this.OnUpdate = func(ent *veng.ButtonEnt) {
		ent.On = !gam.FullscreenEnabled()
	}
	this.OnClick = func(ent *veng.ButtonEnt) {
		if ent.On {
			gam.ReqFullscreen(veng.FullscreenReqExit)
		} else {
			gam.ReqFullscreen(veng.FullscreenReqEnter)
		}
	}
	return this
}

func NewCursorKeyToggle(cursor *veng.CursorEnt) *veng.ButtonEnt {
	this := newButtonEnt("kbd", veng.ButtonTypeToggle)
	this.OnUpdate = func(ent *veng.ButtonEnt) {
		ent.On = cursor.KbdEnabled
	}
	this.OnClick = func(ent *veng.ButtonEnt) {
		cursor.KbdEnabled = ent.On
	}
	return this
}

func newButtonEnt(
	label string,
	buttonType veng.ButtonType,
) *veng.ButtonEnt {
	this := veng.ButtonEnt{
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
			Margin: vgeo.NewXY(float32(UIButtonGap), float32(0)),
		},
		AnchorMode: veng.ButtonAnchorRelative,
		MinW:       buttonMinW,
		Type:       buttonType,
	}
	this.Text.SetText(label)
	this.Text.Z = gfx.ZUIText
	this.NinePatchEnt.SetZ(gfx.ZUIWidget)
	return &this
}

func UpdateButtons(
	vec *vvec.Vec[*veng.ButtonEnt],
	gam *Game,
) veng.Status {
	in := gam.In()
	cursorPhy := gam.Cursor().HitboxPhy()
	ents := vec.Vals()
	loop := veng.Pause
	for i := range ents {
		ent := ents[i]
		layer := gam.Layer(ent.Z().Layer())
		loop |= ent.Update(
			in, &layer.Sprs, layer, gam.Font(), cursorPhy,
		)
	}
	return loop
}
