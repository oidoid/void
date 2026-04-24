package vinput

import "github.com/oidoid/void/src/void/vmath"

type WheelPoll struct {
	// horizontal, vertical, and depth scroll delta in client pixels.
	Delta vmath.XYZ[float32]
}
