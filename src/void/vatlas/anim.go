package vatlas

import (
	"github.com/oidoid/void/src/void/vgeo"
)

// an animation within an Atlas.
type Anim struct {
	// number of cels in a full animation cycle including cels extended for
	// duration and the second half of pingpongs.
	Cels uint8
	// clipbox / source area.
	W, H uint16
	// outgoing collision rectangle (red / blue). may be zero.
	Hitbox vgeo.Box[uint16]
	// incoming collision rectangle (green / blue). may be zero.
	Hurtbox vgeo.Box[uint16]
}
