package vinput

const MaxPointers uint8 = 5
const MaxGamepads uint8 = 4

type Input struct {
	PointersLen uint8
	Pointers    [MaxPointers]PointerPoll
	Wheel       WheelPoll
	Keyboard    KeyboardPoll
	GamepadsLen uint8
	Gamepads    [MaxGamepads]GamepadPoll
}

func (this *Input) PrimaryPointer() *PointerPoll {
	for i := range this.PointersLen {
		if this.Pointers[i].Primary {
			return &this.Pointers[i]
		}
	}
	return nil
}
