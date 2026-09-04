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

type Pointer struct {
	Drag Drag
	// physical pointer bounds changed since the preceding input poll.
	Moved     bool
	poll      PointerPoll
	xy        vgeo.XY[float32] // cam XY.
	center    vgeo.XY[float32] // to-do: is this even useful? i need layer offset.
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

func newPointer(
	poll PointerPoll, cam vgeo.XY[float32], moved bool,
) Pointer {
	phyW := poll.Phy.W()
	phyH := poll.Phy.H()
	xy := cam.Add(poll.Phy.Min)
	return Pointer{
		poll:      poll,
		Moved:     moved,
		xy:        xy,
		center:    vgeo.NewXY(xy.X+phyW/2, xy.Y+phyH/2),
		centerPhy: vgeo.NewXY(poll.Phy.Min.X+phyW/2, poll.Phy.Min.Y+phyH/2),
	}
}

func (this *Pointer) Clicks() Click {
	if this == nil {
		return 0
	}
	return this.poll.Clicks
}

func (this *Pointer) Primary() bool {
	if this == nil {
		return false
	}
	return this.poll.Primary
}

func (this *Pointer) Pressure() float32 {
	if this == nil {
		return 0
	}
	return this.poll.Pressure
}

func (this *Pointer) ID() int32 {
	if this == nil {
		return -1
	}
	return this.poll.ID
}

func (this *Pointer) Tilt() *vgeo.XY[int8] {
	if this == nil {
		return nil
	}
	return &this.poll.Tilt
}

func (this *Pointer) Twist() uint16 {
	if this == nil {
		return 0
	}
	return this.poll.Twist
}

func (this *Pointer) Device() PointerDevice {
	if this == nil {
		return PointerDeviceUnknown
	}
	return this.poll.Device
}

// to-do: why is this a box? where is the point inside the box?
// to-do: rename CamX, CamY, UIX, UIY / HUDX, HUDY?
func (this *Pointer) Phy() *vgeo.Box[float32] {
	if this == nil {
		return nil
	}
	return &this.poll.Phy
}

func (this *Pointer) Center() *vgeo.XY[float32] {
	if this == nil {
		return nil
	}
	return &this.center
}

func (this *Pointer) CenterPhy() *vgeo.XY[float32] {
	if this == nil {
		return nil
	}
	return &this.centerPhy
}

// to-do: how does this work with multiple scales? i think cam is always in phy
// and input has fixed and cam relative positiions.
// XY returns the pointer's level-space position (physical position offset by
// the cam).
func (this *Pointer) XY() *vgeo.XY[float32] {
	if this == nil {
		return nil
	}
	return &this.xy
}

type PointerDevice uint8

const (
	PointerDeviceUnknown PointerDevice = iota
	PointerDeviceMouse
	PointerDevicePen
	PointerDeviceTouch
)

// virtual pointing device state. devices are ephemeral and may be virtual.
type PointerPoll struct {
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
	Device PointerDevice
	// true if this is the primary pointer.
	Primary bool
	// bitmask of buttons pressed.
	Clicks Click
}
