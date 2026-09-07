package vin

import "github.com/oidoid/void/src/void/vgeo"

type Click = uint8

const (
	ClickPrimary   Click = 1 << iota // left.
	ClickSecondary                   // right.
	ClickAux                         // middle.
	ClickBack
	ClickForward

	clickBits = iota // bit-width of the defined button set; sizes clickMap
)

type Ptr struct {
	Drag Drag
	// physical pointer bounds changed since the preceding input poll.
	Moved     bool
	poll      PtrPoll
	centerPhy vgeo.XY[float32]
}

// to-do: does distinguishing input end on simper than start off? i think it's
// easier to think in terms of on + an edge. do we miss being able to check some
// conditions?
type Drag struct {
	// physical pointer position when pressed.
	StartPhy vgeo.XY[float32]
	// physical pointer movement since the last update.
	DeltaPhy vgeo.XY[float32]
	On       bool
	Start    bool // first active frame.
	End      bool // first inactive frame after dragging.
}

func newPtr(poll PtrPoll, moved bool) Ptr {
	phyW := poll.Phy.W()
	phyH := poll.Phy.H()
	return Ptr{
		poll:      poll,
		Moved:     moved,
		centerPhy: vgeo.NewXY(poll.Phy.Min.X+phyW/2, poll.Phy.Min.Y+phyH/2),
	}
}

func (this *Ptr) Clicks() Click {
	if this == nil {
		return 0
	}
	return this.poll.Clicks
}

func (this *Ptr) Primary() bool {
	if this == nil {
		return false
	}
	return this.poll.Primary
}

func (this *Ptr) Pressure() float32 {
	if this == nil {
		return 0
	}
	return this.poll.Pressure
}

func (this *Ptr) ID() int32 {
	if this == nil {
		return -1
	}
	return this.poll.ID
}

func (this *Ptr) Tilt() *vgeo.XY[int8] {
	if this == nil {
		return nil
	}
	return &this.poll.Tilt
}

func (this *Ptr) Twist() uint16 {
	if this == nil {
		return 0
	}
	return this.poll.Twist
}

func (this *Ptr) Device() PtrDevice {
	if this == nil {
		return PtrDevUnknown
	}
	return this.poll.Device
}

// to-do: why is this a box? where is the point inside the box?
func (this *Ptr) Phy() *vgeo.Box[float32] {
	if this == nil {
		return nil
	}
	return &this.poll.Phy
}

func (this *Ptr) CenterPhy() *vgeo.XY[float32] {
	if this == nil {
		return nil
	}
	return &this.centerPhy
}

type PtrDevice uint8

const (
	PtrDevUnknown PtrDevice = iota
	PtrDevMouse
	PtrDevPen
	PtrDevTouch
)

// virtual pointing device state. devices are ephemeral and may be virtual.
type PtrPoll struct {
	// pointer ID; -1 if nonpointing device (eg, a click event fired on a button
	// activated via keyboard).
	ID int32
	// coords in physical pixels from top-left and contact area in physical
	// pixels.
	Phy vgeo.Box[float32]
	// normalized pressure in [0, 1].
	Pressure float32
	// pen tilt from the screen plane in [-90°, 90°].
	Tilt vgeo.XY[int8]
	// pen rotation around its axis in degrees [0°, 359°].
	Twist  uint16
	Device PtrDevice
	// true if this is the primary pointer.
	Primary bool
	// bitmask of buttons pressed.
	Clicks Click
}
