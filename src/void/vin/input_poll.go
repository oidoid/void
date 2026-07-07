package vin

const MaxPointers uint8 = 5
const MaxGamepads uint8 = 4

// a snapshot of input for a frame.
type InputPoll struct {
	PtrsLen uint8
	Ptrs    [MaxPointers]PointerPoll
	Wheel   WheelPoll
	Kbd     KeyboardPoll
	PadsLen uint8
	Pads    [MaxGamepads]GamepadPoll
}
