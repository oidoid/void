package vinput

import "github.com/oidoid/void/src/void/vgeo"

type Click = uint8

const (
	ClickPrimary   Click = 1 << iota // left.
	ClickSecondary                   // right.
	ClickAuxiliary                   // middle.
	ClickBack
	ClickForward

	clickBits = iota // bit-width of the defined button set; sizes clickMap
)

type Pointer struct {
	poll      PointerPoll
	xy        vgeo.XY[float32] // cam XY.
	center    vgeo.XY[float32]
	centerPhy vgeo.XY[float32]
}

func newPointer(poll PointerPoll, cam vgeo.XY[float32]) Pointer {
	phyW := poll.Phy.W()
	phyH := poll.Phy.H()
	xy := vgeo.XY[float32]{X: cam.X + poll.Phy.Min.X, Y: cam.Y + poll.Phy.Min.Y}
	return Pointer{
		poll:   poll,
		xy:     xy,
		center: vgeo.XY[float32]{X: xy.X + phyW/2, Y: xy.Y + phyH/2},
		centerPhy: vgeo.XY[float32]{
			X: poll.Phy.Min.X + phyW/2, Y: poll.Phy.Min.Y + phyH/2,
		},
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
