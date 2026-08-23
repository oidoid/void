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
	Base      vatlas.Tag
	Focused   vatlas.Tag
	On        vatlas.Tag
	FocusedOn vatlas.Tag
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
	cursorPhy *vgeo.Box[float32],
) vgame.Status {
	this.Layout(font, layer.Clip)
	this.Start = false
	if this.OnUpdate != nil {
		this.OnUpdate(this)
	}
	bounds := this.AnchorBox()
	this.Focused = false
	if cursorPhy != nil {
		lo := layer.PhyToLayer(cursorPhy.Min)
		hi := layer.PhyToLayer(cursorPhy.Max)
		this.Focused = bounds.HitsBox(vgeo.Box[float32]{Min: lo, Max: hi})
	}
	offStart := this.Type == ButtonTypeToggle && this.Focused &&
		in.IsOffStart(vin.ButtonA)
	pressed := this.Focused && in.IsOn(vin.ButtonA)
	wasOn := this.On
	if this.Type == ButtonTypeToggle {
		if offStart {
			this.On = !this.On
		}
	} else {
		this.On = pressed
	}
	this.Start = wasOn != this.On
	loop := vgame.Pause
	if pressed {
		loop = vgame.Loop
	}

	if !layer.Clip.HitsBox(bounds) {
		return loop
	}
	for i := range this.PatchByDir {
		this.PatchByDir[i].SetPal(this.pal(this.Pals, pressed))
	}
	this.NinePatchEnt.Update(sprs)

	if this.Text.Text != "" {
		this.Text.XY = vgeo.NewXY(
			int16(this.XY.X)+(int16(this.WH.W)-this.Text.Layout.W)/2,
			int16(this.XY.Y)+(int16(this.WH.H)-this.Text.Layout.TrimAllForceH)/2,
		)
		this.Text.Pal = this.pal(this.TextPals, pressed)
		this.Text.Update(font, sprs, layer.Clip)
	}

	if this.Clicked() && this.OnClick != nil {
		this.OnClick(this)
	}
	if this.Start {
		loop = vgame.Loop
	}
	return loop
}

func (this *ButtonEnt) pal(pals ButtonPals, pressed bool) vatlas.Tag {
	on := this.On
	if this.Type == ButtonTypeToggle && pressed {
		on = !on
	}
	if this.Focused && on {
		return pals.FocusedOn
	}
	if this.Focused {
		return pals.Focused
	}
	if on {
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
