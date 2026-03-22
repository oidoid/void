package input

type PointerDevice uint8

const (
	PointerDeviceUnknown PointerDevice = iota
	PointerDeviceMouse
	PointerDevicePen
	PointerDeviceTouch
)

type PointerEvent struct {
	// -1 is nonpointing device (eg, a click event fired on a button activated via
	// keyboard).
	ID   int32
	X, Y float32
	//lint:ignore U1000 .
	device  PointerDevice
	Event   PointerEventType
	Primary bool
	Buttons uint8
}

type PointerEventType uint8

const (
	PointerEventTypeCancel PointerEventType = iota
	PointerEventTypeDown
	PointerEventTypeMove
	PointerEventTypeUp
)
