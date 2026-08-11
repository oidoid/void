package vin

import "github.com/oidoid/void/src/void/vgeo"

type Wheel struct {
	WheelPoll
}

type WheelPoll struct {
	// horizontal, vertical, and depth scroll delta in client pixels.
	Delta vgeo.XYZ[float32]
	// signed trackpad pinch delta in client pixels.
	Pinch float32
}
