package vinput

type GamepadMapping uint8

const (
	GamepadMappingUnknown GamepadMapping = iota
	GamepadMappingStandard
)

// virtual gamepad state. index matches the browser gamepad index slot.
type GamepadPoll struct {
	// gamepad slot index.
	Index uint8
	// true if the gamepad is still connected.
	Connected bool
	// button layout mapping.
	Mapping GamepadMapping
	// bitmask of pressed buttons (standard mapping: 0 A, 1 B, 2 X, 3 Y,
	// 4 L1, 5 R1, 6 L2, 7 R2, 8 select, 9 start, 10 L3, 11 R3,
	// 12 up, 13 down, 14 left, 15 right).
	Buttons uint32
	// axes in [-1, 1]; standard mapping: [leftX, leftY, rightX, rightY].
	Axes [4]float32
}
