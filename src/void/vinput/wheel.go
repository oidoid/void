package vinput

import "github.com/oidoid/void/src/void/vgeo"

type Wheel struct {
	WheelPoll
}

type WheelPoll struct {
	// horizontal, vertical, and depth scroll delta in client pixels.
	Delta vgeo.XYZ[float32]
}
