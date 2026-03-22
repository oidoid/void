package input

type PointerDevice uint8

const (
	PointerDeviceUnknown PointerDevice = iota
	PointerDeviceMouse
	PointerDevicePen
	PointerDeviceTouch
)

// to-do: this isn't even an event. it's just current state!
// to-do: we need one of these for each pointing device. maybe support 10 (one pointer per finger).
type PointerEvent struct {
	// pointer ID; -1 if nonpointing device (eg, a click event fired on a button
	// activated via keyboard).
	ID int32
	// coords in client pixels from top-left.
	X, Y float32
	//lint:ignore U1000 .
	device  PointerDevice
	Event   PointerEventType
	Primary bool
	// bitmask of buttons pressed: 1: primary (left); 2: secondary (right)';
	// 4: auxiliary (middle), 8: back, 16: forward.
	Buttons uint8
}

type PointerEventType uint8

const (
	PointerEventTypeCancel PointerEventType = iota
	PointerEventTypeDown
	PointerEventTypeMove
	PointerEventTypeUp
)
