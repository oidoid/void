package vinput

import "github.com/oidoid/void/src/void/vgeo"

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
	// coords in physical pixels from top-left and contact area in physical pixels.
	Phy vgeo.Box[float32]
	// normalized pressure in [0, 1].
	Pressure float32
	// pen tilt from the screen plane in [-90°, 90°].
	vgeo.XY[int8]
	// pen rotation around its axis in degrees [0°, 359°].
	Twist  uint16
	Device PointerDevice
	// true if this is the primary pointer.
	Primary bool
	// bitmask of buttons pressed: 1 primary (left); 2 secondary (right);
	// 4 auxiliary (middle), 8 back, 16 forward.
	Buttons uint8
}

type PointerEventType uint8

const (
	PointerEventTypeCancel PointerEventType = iota
	PointerEventTypeDown
	PointerEventTypeMove
	PointerEventTypeUp
)
