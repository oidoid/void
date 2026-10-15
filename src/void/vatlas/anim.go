package vatlas

import (
	"github.com/oidoid/void/src/void/vgeo"
)

// an animation within an Atlas.
type Anim struct {
	// number of cels in a full animation cycle including cels extended for
	// duration and the second half of pingpongs. board tiles always have one cel.
	Cels uint8
	// clipbox / source area.
	W, H uint16
	// inclusive outgoing collision bounds (red / blue). zero disables.
	Hitbox vgeo.Box[uint16]
	// inclusive incoming collision bounds (green / blue). zero disables.
	Hurtbox vgeo.Box[uint16]
}
