package ventities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

type ButtonType int8

const (
	ButtonTypeButton ButtonType = iota
	ButtonTypeToggle
)

type ButtonAnchorMode uint8

const (
	ButtonAnchorNone ButtonAnchorMode = iota
	ButtonAnchorHUD
	ButtonAnchorRelative
)

type ButtonPals struct {
	Base      vatlas.AnimID
	Focused   vatlas.AnimID
	On        vatlas.AnimID
	FocusedOn vatlas.AnimID
}

type ButtonEnt struct {
	// to-do: i don't like the way these ents compose. now we have an XY embed
	// here and another XY in Text and Anchor is weird too.
	NinePatchEnt
	Pals     ButtonPals
	TextPals ButtonPals
	Text     TextEnt
	// to-do: rename HUDAnchorEnt?
	ClipAnchor HUDEnt // clip-relative positioning; takes priority over Anchor.
	Anchor     AnchorEnt
	AnchorMode ButtonAnchorMode
	MinW       uint16
	Type       ButtonType
	On         bool
	Start      bool
	Focused    bool
	OnUpdate   func(*ButtonEnt)
	OnClick    func(*ButtonEnt)
}

func (this *ButtonEnt) Layout(
	font *vtext.Font, clip vgeo.Box[float32],
) {
	if this.Text.Text != "" {
		this.Text.LayoutChars(font)
		edge := uint16(this.CornerWH.W)
		pad2 := 2 * (2 + edge)
		this.WH.W = uint16(this.Text.Layout.W) + pad2
		this.WH.H = uint16(this.Text.Layout.TrimAllForceH) + pad2
	}
	this.WH.W = max(this.WH.W, this.MinW)

	// require even gap between button and text so integer division centers.
	if this.Text.Text != "" {
		if (this.WH.W-uint16(this.Text.Layout.W))%2 != 0 {
			this.WH.W++
		}
		if (this.WH.H-uint16(this.Text.Layout.TrimAllForceH))%2 != 0 {
			this.WH.H++
		}
	}
	switch this.AnchorMode {
	case ButtonAnchorHUD:
		xy := this.ClipAnchor.XY(int16(this.WH.W), int16(this.WH.H), clip)
		this.XY = vgeo.NewXY(float32(xy.X), float32(xy.Y))
	case ButtonAnchorRelative:
		this.XY = this.Anchor.XY(float32(this.WH.W), float32(this.WH.H))
	}
}

func (this *ButtonEnt) AnchorBox() vgeo.Box[float32] {
	return vgeo.XYWH(
		this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
	)
}

func (this *ButtonEnt) Update(
	in *vin.In,
	sprs *[]vgfx.Spr,
	layer *vgfx.LayerConfig,
	font *vtext.Font,
	cursorPhy *vgeo.XY[float32],
) vgame.Status {
	this.Layout(font, layer.Clip)
	this.Start = false
	if this.OnUpdate != nil {
		this.OnUpdate(this)
	}
	this.Focused = false
	if cursorPhy != nil {
		xy := layer.PhyToLayer(*cursorPhy) // to-do: can input expose a layer XY?
		bounds := vgeo.XYWH(
			this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
		)
		this.Focused = bounds.HitsXY(xy)
	}
	wasOn := this.On
	if this.Type == ButtonTypeToggle {
		if this.Focused && in.IsOnEnd(vin.ButtonA) {
			this.On = !this.On
		}
	} else {
		this.On = this.Focused && in.IsOn(vin.ButtonA)
	}
	this.Start = wasOn != this.On

	bounds := vgeo.XYWH(
		this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
	)
	if !layer.Clip.HitsBox(bounds) {
		return vgame.Pause
	}
	for i := range this.PatchByDir {
		this.PatchByDir[i].SetPal(this.pal(this.Pals))
	}
	this.NinePatchEnt.Update(sprs)

	if this.Text.Text != "" {
		this.Text.XY = vgeo.NewXY(
			int16(this.XY.X)+(int16(this.WH.W)-this.Text.Layout.W)/2,
			int16(this.XY.Y)+(int16(this.WH.H)-this.Text.Layout.TrimAllForceH)/2,
		)
		this.Text.Pal = this.pal(this.TextPals)
		this.Text.Update(font, sprs, layer.Clip)
	}

	if this.Clicked() && this.OnClick != nil {
		this.OnClick(this)
	}
	if this.Start {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *ButtonEnt) pal(pals ButtonPals) vatlas.AnimID {
	if this.Focused && this.On {
		return pals.FocusedOn
	}
	if this.Focused {
		return pals.Focused
	}
	if this.On {
		return pals.On
	}
	return pals.Base
}

func (this *ButtonEnt) Clicked() bool {
	if this.Type == ButtonTypeToggle {
		return this.Start
	}
	return this.IsOffStart()
}

func (this *ButtonEnt) OnStart() bool {
	return this.On && this.Start
}

func (this *ButtonEnt) IsOffStart() bool {
	return !this.On && this.Start && this.Focused
}
