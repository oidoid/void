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
	NinePatchEnt  // edge is overwritten.
	UnfocusedEdge vatlas.AnimID
	FocusedEdge   vatlas.AnimID
	Fill          vatlas.AnimID
	FocusedFill   vatlas.AnimID
	Text          TextEnt
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
	sprites *[]vgfx.Sprite,
	layer *vgfx.LayerConfig,
	font *vtext.Font,
) vgame.Status {
	this.Layout(font, layer.Clip)
	this.Start = false
	if this.OnUpdate != nil {
		this.OnUpdate(this)
	}
	if phy := in.Ptr.CenterPhy(); phy != nil {
		xy := layer.PhyToLayer(*phy) // to-do: can input expose a layer XY?
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

	edge := this.UnfocusedEdge
	if this.Focused {
		edge = this.FocusedEdge
	}
	if this.Fill != 0 || this.FocusedFill != 0 {
		fill := this.Fill
		// to-do: don't do automasking. it makes it really confusing to have state
		// mutate on access.
		if this.Type == ButtonTypeButton && this.On && this.Focused ||
			this.Type == ButtonTypeToggle && !this.On && this.Focused && in.IsOn(vin.ButtonA) ||
			this.Type == ButtonTypeToggle && this.On && !in.IsOn(vin.ButtonA) {
			fill = this.FocusedFill
		}
		if fill != 0 {
			this.PatchByDir[vgeo.DirCenter].SetAnim(fill)
		}
	}
	this.PatchByDir[vgeo.DirN].SetAnim(edge) // to-do: palette swap.
	this.PatchByDir[vgeo.DirE].SetAnim(edge)
	this.PatchByDir[vgeo.DirS].SetAnim(edge)
	this.PatchByDir[vgeo.DirW].SetAnim(edge)
	this.NinePatchEnt.Update(sprites)

	if this.Text.Text != "" {
		this.Text.XY = vgeo.XY[int16]{
			X: int16(this.XY.X) + (int16(this.WH.W)-this.Text.Layout.W)/2,
			Y: int16(this.XY.Y) + (int16(this.WH.H)-this.Text.Layout.TrimAllForceH)/2,
		}
		this.Text.Update(font, sprites, layer.Clip)
	}

	if this.Clicked() && this.OnClick != nil {
		this.OnClick(this)
	}
	if this.Start {
		return vgame.Loop
	}
	return vgame.Pause
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
