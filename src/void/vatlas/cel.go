package vatlas

import "github.com/oidoid/void/src/void/vgeo"

// an animation frame.
type Cel struct {
	vgeo.XY[uint16]        // position within the atlas image.
	Millis          uint16 // duration in milliseconds; at least 1.
}
