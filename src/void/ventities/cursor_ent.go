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
	// cursor position in layer coordinates. retains subpixel keyboard movement.
	XY      vgeo.XY[float32]
	Hitbox  vgeo.Box[float32]
	Z       vgfx.Z
	Visible bool // false until the first pointer or keyboard input.
	// enables keyboard movement when the app selects keyboard cursor mode.
	KbdEnabled bool
	// keyboard cursor velocity in px/sec.
	KbdVel float32
	// visible and hitbox position in layer coordinates. stays pixel aligned during
	// keyboard movement.
	snapXY vgeo.XY[float32]
	// reports whether keyboard movement initialized XY and snapXY.
	kbdOn bool
	// current tag; toggled between pointTag and pickTag.
	tag         vatlas.Tag
	hitboxCopy  vgeo.Box[float32]
	hitboxPhy   vgeo.Box[float32]
	hitboxPhyOn bool
	// tag when no button is pressed.
	pointTag vatlas.Tag
	// tag when a button is pressed. zero disables the pick spr.
	pickTag vatlas.Tag
}

func NewCursorEnt(
	pointTag, pickTag vatlas.Tag,
	kbdVel float32,
	hitbox vgeo.Box[uint16],
	z vgfx.Z,
) CursorEnt {
	hitboxF32 := vgeo.NewBox(
		float32(hitbox.Min.X), float32(hitbox.Min.Y),
		float32(hitbox.Max.X), float32(hitbox.Max.Y),
	)
	return CursorEnt{
		KbdVel:     kbdVel,
		pointTag:   pointTag,
		pickTag:    pickTag,
		Hitbox:     hitboxF32,
		hitboxCopy: hitboxF32,
		tag:        pointTag,
		Z:          z,
	}
}

func (this *CursorEnt) Update(
	in *vin.In,
	sprs *[]vgfx.Spr,
	deltaSecs float64,
	layer *vgfx.LayerConfig,
) vgame.Status {
	ptr := in.Ptr
	ptrMoved := ptr != nil && ptr.Moved
	if ptrMoved {
		this.onCursorPoint(*ptr.CenterPhy(), ptr.Device(), layer)
	}
	if ptr == nil && !this.KbdEnabled {
		this.Visible = false
	}

	dirX := int(in.Dir.X)
	dirY := int(in.Dir.Y)
	if !ptrMoved && this.KbdEnabled && this.KbdVel > 0 &&
		(dirX != 0 || dirY != 0 || in.IsAnyOnStart(vin.ButtonA)) {
		this.onCursorKey(in, dirX, dirY, deltaSecs, layer.Clip)
	} else if !this.KbdEnabled || dirX == 0 && dirY == 0 {
		this.kbdOn = false
	}

	if this.pickTag != 0 && in.IsOn(vin.ButtonA) {
		this.tag = this.pickTag
	} else {
		this.tag = this.pointTag
	}

	this.Hitbox = this.hitboxCopy
	this.Hitbox.MoveTo(this.snapXY)
	this.hitboxPhyOn = this.Visible || !this.KbdEnabled && ptr != nil &&
		ptr.CenterPhy() != nil
	if this.hitboxPhyOn {
		lo := layer.LayerToPhy(this.Hitbox.Min)
		hi := layer.LayerToPhy(this.Hitbox.Max)
		this.hitboxPhy = vgeo.Box[float32]{Min: lo, Max: hi}
	}
	if !this.Visible {
		return vgame.Pause
	}
	*sprs = append(*sprs, vgfx.Spr{
		XY:     this.snapXY,
		TagCel: this.tag.Cel(0),
		Z:      this.Z,
	})
	if this.kbdOn {
		return vgame.Loop
	}
	return vgame.Pause
}

func (this *CursorEnt) onCursorPoint(
	phy vgeo.XY[float32], dev vin.PointerDevice, layer *vgfx.LayerConfig,
) {
	this.XY = layer.PhyToLayer(phy)
	this.snapXY = this.XY
	this.kbdOn = false
	this.Visible = dev == vin.PointerDeviceMouse
}

// returns the physical hitbox computed by Update, or nil when inactive.
func (this *CursorEnt) HitboxPhy() *vgeo.Box[float32] {
	if this == nil || !this.hitboxPhyOn {
		return nil
	}
	return &this.hitboxPhy
}

func (this *CursorEnt) onCursorKey(
	in *vin.In, dirX, dirY int, deltaSecs float64, clip vgeo.Box[float32],
) {
	by := vgeo.NewXY(
		float32(dirX)*this.KbdVel*float32(deltaSecs),
		float32(dirY)*this.KbdVel*float32(deltaSecs),
	)
	xy := &this.XY
	if by != (vgeo.XY[float32]{}) {
		snapXY := this.snapXY
		if !this.kbdOn || in.PrevDir == (vgeo.XY[int8]{}) {
			*xy = vgfx.SnapXY(snapXY, by)
			snapXY = *xy
		} else {
			if in.PrevDir.X != int8(dirX) {
				xy.X = snapXY.X
			}
			if in.PrevDir.Y != int8(dirY) {
				xy.Y = snapXY.Y
			}
		}
		xy.AddTo(by)
		xy.X = vmath.Clamp(clip.Min.X, clip.Max.X, xy.X)
		xy.Y = vmath.Clamp(clip.Min.Y, clip.Max.Y, xy.Y)
		snapBy := by
		if snapXY.X == clip.Min.X && by.X < 0 ||
			snapXY.X == clip.Max.X && by.X > 0 {
			snapBy.X = 0
		}
		if snapXY.Y == clip.Min.Y && by.Y < 0 ||
			snapXY.Y == clip.Max.Y && by.Y > 0 {
			snapBy.Y = 0
		}
		this.snapXY = vgfx.SnapMove(*xy, snapXY, snapBy)
	}

	beforeSnapXY := this.snapXY
	this.snapXY.X = vmath.Clamp(clip.Min.X, clip.Max.X, this.snapXY.X)
	this.snapXY.Y = vmath.Clamp(clip.Min.Y, clip.Max.Y, this.snapXY.Y)
	if this.snapXY.X != beforeSnapXY.X {
		xy.X = this.snapXY.X
	}
	if this.snapXY.Y != beforeSnapXY.Y {
		xy.Y = this.snapXY.Y
	}
	this.kbdOn = dirX != 0 || dirY != 0
	this.Visible = true
}
