package vinput

const maxAxes = 4 // leftX, leftY, rightX, rightY.

type GamepadMapping uint8

const (
	GamepadMappingUnknown GamepadMapping = iota
	GamepadMappingStandard
)

type GamepadButton uint16

const (
	GamepadButtonA GamepadButton = 1 << iota // cross.
	GamepadButtonB                           // circle.
	GamepadButtonX                           // square.
	GamepadButtonY                           // triangle.
	GamepadButtonL1
	GamepadButtonR1
	GamepadButtonL2
	GamepadButtonR2
	GamepadButtonSelect
	GamepadButtonStart
	GamepadButtonL3
	GamepadButtonR3
	GamepadButtonUp
	GamepadButtonDown
	GamepadButtonLeft
	GamepadButtonRight

	gamepadButtonBits = iota
)

// gamepad state. index matches the browser gamepad index slot.
type GamepadPoll struct {
	// gamepad slot index.
	Index uint8
	// true if the gamepad is still connected.
	Connected bool
	// button layout mapping.
	Mapping GamepadMapping
	// bitmask of pressed buttons.
	Buttons GamepadButton
	// axes in [-1, 1]; standard mapping: [leftX, leftY, rightX, rightY].
	Axes [4]float32
}

type Gamepad struct {
	GamepadPoll
}
