package veng

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vmath"
)

// update this ent first. always prefer testing against cursor, not input, in
// other game. the cursor may be moved by keyboard and has a hitbox.
type CursorEnt struct {
	Spr vgfx.Spr
	// keeps subpixel keyboard movement in layer coordinates.
	XY      vgeo.XY[float32]
	Hitbox  vgeo.Box[float32]
	Visible bool // false until the first pointer or keyboard input.
	// enables keyboard movement when the app selects keyboard cursor mode.
	KbdEnabled bool
	// keyboard cursor velocity in px/sec.
	KbdVel float32
	// reports whether keyboard movement initialized XY and Spr.XY.
	kbdOn       bool
	hitboxCopy  vgeo.Box[float32]
	hitboxPhy   vgeo.Box[float32]
	hitboxPhyOn bool
	// tag when no button is pressed.
	pointTag vatlas.Tag
	// tag when a button is pressed. zero disables the pick spr.
	pickTag vatlas.Tag
}

func NewCursorEnt(
	spawn vboards.Spawn,
	pickTag vatlas.Tag,
	kbdVel float32,
	hitbox vgeo.Box[uint16],
) CursorEnt {
	hitboxF32 := hitbox.Cast[float32]()
	this := CursorEnt{
		Spr:        spawn.Spr(),
		KbdVel:     kbdVel,
		pointTag:   spawn.Tag,
		pickTag:    pickTag,
		XY:         spawn.XY,
		Hitbox:     hitboxF32,
		hitboxCopy: hitboxF32,
	}
	return this
}

func (this *CursorEnt) Update(
	in *vin.In,
	sprs *[]vgfx.Spr,
	deltaSecs float64,
	layer *vgfx.LayerConfig,
) Status {
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

	this.Hitbox = this.hitboxCopy
	this.Hitbox.MoveTo(this.Spr.XY)
	this.hitboxPhyOn = this.Visible || !this.KbdEnabled && ptr != nil &&
		ptr.CenterPhy() != nil
	if this.hitboxPhyOn {
		lo := layer.LayerToPhy(this.Hitbox.Min)
		hi := layer.LayerToPhy(this.Hitbox.Max)
		this.hitboxPhy = vgeo.Box[float32]{Min: lo, Max: hi}
	}
	if !this.Visible {
		return Pause
	}
	this.Spr.SetTag(this.pointTag)
	if this.pickTag != 0 && in.IsOn(vin.ButtonA) {
		this.Spr.SetTag(this.pickTag)
	}
	*sprs = append(*sprs, this.Spr)
	if this.kbdOn {
		return Loop
	}
	return Pause
}

func (this *CursorEnt) onCursorPoint(
	phy vgeo.XY[float32], dev vin.PtrDevice, layer *vgfx.LayerConfig,
) {
	this.XY = layer.PhyToLayer(phy)
	this.Spr.XY = this.XY
	this.kbdOn = false
	this.Visible = dev == vin.PtrDevMouse
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
		snapXY := this.Spr.XY
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
		this.Spr.XY = vgfx.SnapMove(*xy, snapXY, snapBy)
	}

	beforeSnapXY := this.Spr.XY
	this.Spr.X = vmath.Clamp(clip.Min.X, clip.Max.X, this.Spr.X)
	this.Spr.Y = vmath.Clamp(clip.Min.Y, clip.Max.Y, this.Spr.Y)
	if this.Spr.X != beforeSnapXY.X {
		xy.X = this.Spr.X
	}
	if this.Spr.Y != beforeSnapXY.Y {
		xy.Y = this.Spr.Y
	}
	this.kbdOn = dirX != 0 || dirY != 0
	this.Visible = true
}
