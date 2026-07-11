package ventities

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vmath"
)

// update this ent first. always prefer testing against cursor, not input, in
// other entities. the cursor may be moved by keyboard and has a hitbox.
type CursorEnt struct {
	XY      vgeo.XY[float32]
	Z       vgfx.Z
	Visible bool // false until the first pointer or keyboard input.
	// current animation ID; toggled between PointAnimID and PickAnimID.
	AnimID vatlas.AnimID
	// keyboard cursor velocity in pixels/second. zero disables keyboard control.
	Keyboard float32
	// animation ID when no button is pressed.
	PointAnimID vatlas.AnimID
	// animation ID when a button is pressed. zero disables pick animation.
	PickAnimID vatlas.AnimID
}

func NewCursorEnt(
	pointAnimID, pickAnimID vatlas.AnimID, keyboard float32, z vgfx.Z,
) CursorEnt {
	return CursorEnt{
		PointAnimID: pointAnimID,
		PickAnimID:  pickAnimID,
		Keyboard:    keyboard,
		AnimID:      pointAnimID,
		Z:           z,
	}
}

func (this *CursorEnt) Update(
	in *vin.In,
	sprites *[]vgfx.Sprite,
	deltaMs float64,
	layer *vgfx.LayerConfig,
) vgame.Status {
	if phy := in.Ptr.Phy(); phy != nil {
		this.onCursorPoint(*phy, in.Ptr.Device(), layer)
	} else if this.Keyboard == 0 {
		this.Visible = false
	}

	dirX := int(in.Dir.X)
	dirY := int(in.Dir.Y)
	if in.Ptr == nil && this.Keyboard > 0 &&
		(dirX != 0 || dirY != 0 || in.IsAnyOnStart(vin.ButtonA)) {
		this.onCursorKey(dirX, dirY, deltaMs, layer.Clip)
	}

	if this.PickAnimID != 0 {
		// to-do: this is the one ent that doesn't want to set the mask. it breaks
		// input.
		if in.IsOn(vin.ButtonA) {
			this.AnimID = this.PickAnimID
		} else {
			this.AnimID = this.PointAnimID
		}
	}

	if this.Visible {
		*sprites = append(*sprites, vgfx.Sprite{
			XY:      this.XY,
			AnimCel: this.AnimID.Cel(0),
			Z:       this.Z,
		})
	}
	return vgame.Pause
}

func (this *CursorEnt) onCursorPoint(
	phy vgeo.Box[float32], dev vin.PointerDevice, layer *vgfx.LayerConfig,
) {
	this.XY = layer.PhyToLayer(phy.Min)
	this.Visible = dev == vin.PointerDeviceMouse
}

func (this *CursorEnt) onCursorKey(
	dirX, dirY int, deltaMs float64, clip vgeo.Box[float32],
) {
	spd := vgfx.FloorEpsilon(this.Keyboard * float32(deltaMs) / 1000)

	if dirX != 0 && dirY != 0 {
		this.XY = vgfx.DiagonalizeXY(this.XY, dirX*dirY)
	}

	this.XY.X = vmath.Clamp(
		clip.Min.X,
		clip.Max.X,
		this.XY.X+float32(dirX)*spd,
	)
	this.XY.Y = vmath.Clamp(
		clip.Min.Y,
		clip.Max.Y,
		this.XY.Y+float32(dirY)*spd,
	)
	this.Visible = true
}
