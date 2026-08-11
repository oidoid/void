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
	Hitbox  vgeo.Box[float32]
	Z       vgfx.Z
	Visible bool // false until the first pointer or keyboard input.
	// keyboard cursor velocity in pixels/second. zero disables keyboard control.
	Kbd float32
	// current animation ID; toggled between PointAnimID and PickAnimID.
	animID     vatlas.AnimID
	hitboxCopy vgeo.Box[float32]
	// animation ID when no button is pressed.
	pointAnimID vatlas.AnimID
	// animation ID when a button is pressed. zero disables pick animation.
	pickAnimID vatlas.AnimID
}

func NewCursorEnt(
	pointAnimID, pickAnimID vatlas.AnimID,
	kbd float32,
	hitbox vgeo.Box[uint16],
	z vgfx.Z,
) CursorEnt {
	hitboxF32 := vgeo.NewBox(
		float32(hitbox.Min.X), float32(hitbox.Min.Y),
		float32(hitbox.Max.X), float32(hitbox.Max.Y),
	)
	return CursorEnt{
		Kbd:         kbd,
		pointAnimID: pointAnimID,
		pickAnimID:  pickAnimID,
		Hitbox:      hitboxF32,
		hitboxCopy:  hitboxF32,
		animID:      pointAnimID,
		Z:           z,
	}
}

func (this *CursorEnt) Update(
	in *vin.In,
	sprs *[]vgfx.Spr,
	deltaMs float64,
	layer *vgfx.LayerConfig,
) vgame.Status {
	if phy := in.Ptr.CenterPhy(); phy != nil {
		this.onCursorPoint(*phy, in.Ptr.Device(), layer)
	} else if this.Kbd == 0 {
		this.Visible = false
	}

	dirX := int(in.Dir.X)
	dirY := int(in.Dir.Y)
	if in.Ptr == nil && this.Kbd > 0 &&
		(dirX != 0 || dirY != 0 || in.IsAnyOnStart(vin.ButtonA)) {
		this.onCursorKey(in, dirX, dirY, deltaMs, layer.Clip)
	}

	if this.pickAnimID != 0 && in.IsOn(vin.ButtonA) {
		this.animID = this.pickAnimID
	} else {
		this.animID = this.pointAnimID
	}

	this.Hitbox = this.hitboxCopy
	this.Hitbox.MoveTo(this.XY)
	if !this.Visible {
		return vgame.Pause
	}
	*sprs = append(*sprs, vgfx.Spr{
		XY:      this.XY,
		AnimCel: this.animID.Cel(0),
		Z:       this.Z,
	})
	return vgame.Pause
}

func (this *CursorEnt) onCursorPoint(
	phy vgeo.XY[float32], dev vin.PointerDevice, layer *vgfx.LayerConfig,
) {
	this.XY = layer.PhyToLayer(phy)
	this.Visible = dev == vin.PointerDeviceMouse
}

func (this *CursorEnt) onCursorKey(
	in *vin.In, dirX, dirY int, deltaMs float64, clip vgeo.Box[float32],
) {
	v := vgfx.FloorEpsilon(this.Kbd * float32(deltaMs) / 1000)

	if in.IsAnyOnStart(vin.ButtonL | vin.ButtonR | vin.ButtonU | vin.ButtonD) {
		this.XY = vgfx.DiagonalizeXY(this.XY, vgeo.NewXY(dirX, dirY))
	}

	this.XY.X = vmath.Clamp(clip.Min.X, clip.Max.X, this.XY.X+float32(dirX)*v)
	this.XY.Y = vmath.Clamp(clip.Min.Y, clip.Max.Y, this.XY.Y+float32(dirY)*v)
	this.Visible = true
}
