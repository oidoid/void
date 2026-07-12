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

type ButtonEnt struct {
	// to-do: i don't like the way these ents compose. now we have an XY embed
	// here and another XY in Text and Anchor is weird too.
	NinePatchEnt    // border is overwritten.
	UnfocusedBorder vatlas.AnimID
	FocusedBorder   vatlas.AnimID
	Text            TextEnt
	// to-do: rename HUDAnchorEnt?
	ClipAnchor HUDEnt // clip-relative positioning; takes priority over Anchor.
	Anchor     AnchorEnt
	AnchorMode ButtonAnchorMode
	MinW       uint16
	Type       ButtonType
	On         bool
	Start      bool
	Focused    bool
}

func (this *ButtonEnt) Layout(
	font *vtext.Font, refBox vgeo.Box[float32], clip vgeo.Box[float32],
) {
	if this.Text.Text != "" {
		this.Text.LayoutChars(font)
		border := uint16(this.CornerWH.W)
		pad2 := 2 * (2 + border)
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
		this.XY = this.Anchor.XY(refBox, float32(this.WH.W), float32(this.WH.H))
	}
}

func (this *ButtonEnt) Update(
	in *vin.In,
	sprites *[]vgfx.Sprite,
	layer *vgfx.LayerConfig,
	font *vtext.Font,
) vgame.Status {
	this.Start = false
	if phy := in.Ptr.CenterPhy(); phy != nil {
		xy := layer.PhyToLayer(*phy) // to-do: can input expose a layer XY?
		bounds := vgeo.XYWH(
			this.XY.X, this.XY.Y, float32(this.WH.W), float32(this.WH.H),
		)
		this.Focused = bounds.HitsXY(xy)
	}
	wasOn := this.On
	if this.Type == ButtonTypeToggle {
		if this.Focused && in.IsOnStart(vin.ButtonA) {
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

	border := this.UnfocusedBorder
	if this.Focused {
		border = this.FocusedBorder
	}
	this.PatchByDir[vgeo.DirN].SetAnim(border) // to-do: palette swap.
	this.PatchByDir[vgeo.DirE].SetAnim(border)
	this.PatchByDir[vgeo.DirS].SetAnim(border)
	this.PatchByDir[vgeo.DirW].SetAnim(border)
	this.NinePatchEnt.Update(sprites)

	if this.Text.Text != "" {
		this.Text.XY = vgeo.XY[int16]{
			X: int16(this.XY.X) + (int16(this.WH.W)-this.Text.Layout.W)/2,
			Y: int16(this.XY.Y) + (int16(this.WH.H)-this.Text.Layout.TrimAllForceH)/2,
		}
		this.Text.Update(font, sprites, layer.Clip)
	}

	if this.Start {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *ButtonEnt) OnStart() bool {
	return this.On && this.Start
}

func (this *ButtonEnt) OffStart() bool {
	return !this.On && this.Start && this.Focused
}
