package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	game "github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

const (
	uiButtonGap = int16(4)
	buttonMinW  = 16
)

func NewDrawToggleButton(gam game.Game) *ventities.ButtonEnt {
	this := newButtonEnt("draw", ventities.ButtonTypeToggle)
	this.ClipAnchor = ventities.HUDEnt{
		Anchor: vgeo.DirNE,
		Margin: vgeo.Border[int16]{N: 4, E: 4},
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

func NewContextLossButton(gam game.Game) *ventities.ButtonEnt {
	this := newButtonEnt("!gl", ventities.ButtonTypeButton)
	this.OnClick = func(*ventities.ButtonEnt) {
		gam.RequestContextLoss()
	}
	return this
}

func NewScreenshotButton(gam game.Game) *ventities.ButtonEnt {
	this := newButtonEnt("pic", ventities.ButtonTypeButton)
	this.OnClick = func(*ventities.ButtonEnt) {
		gam.RequestScreenshot()
	}
	return this
}

func NewFullscreenToggle(gam game.Game) *ventities.ButtonEnt {
	this := newButtonEnt("full", ventities.ButtonTypeToggle)
	this.OnUpdate = func(ent *ventities.ButtonEnt) {
		ent.On = gam.Fullscreen()
	}
	this.OnClick = func(ent *ventities.ButtonEnt) {
		gam.RequestFullscreen(ent.On)
	}
	return this
}

func newButtonEnt(
	label string,
	buttonType ventities.ButtonType,
) *ventities.ButtonEnt {
	fill := assets.PaletteBlue
	this := ventities.ButtonEnt{
		NinePatchEnt: ventities.NinePatchEnt{
			PatchByDir: [9]vgfx.Sprite{vgeo.DirCenter: {AnimCel: fill.Cel(0)}},
			CornerWH:   vgeo.WH[uint16]{W: 1, H: 1},
		},
		UnfocusedBorder: assets.PaletteBlack,
		FocusedBorder:   assets.PaletteRed,
		Fill:            fill,
		SelectedFill:    assets.PaletteRed,
		Anchor: ventities.AnchorEnt{
			Dir:    vgeo.DirW,
			Margin: vgeo.NewXY(float32(uiButtonGap), 0),
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
