package vin

const MaxPtrs uint8 = 5
const MaxGamepads uint8 = 4

// a snapshot of input for a frame.
type InPoll struct {
	PtrsLen uint8
	Ptrs    [MaxPtrs]PtrPoll
	Wheel   WheelPoll
	Kbd     KeyboardPoll
	PadsLen uint8
	Pads    [MaxGamepads]GamepadPoll
}
