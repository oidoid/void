package vatlas

import "github.com/oidoid/void/src/void/vmath"

// the number of cels every animation is padded to by repeating the sequence.
const AnimCels = 16

// max animation loop duration in milliseconds.
const MaxAnimLoopMillis = 1000

// the duration of one cel in milliseconds (62.5).
const CelMillis = MaxAnimLoopMillis / AnimCels

const (
	flagHitbox  = 1
	flagHurtbox = 2
)

type Atlas struct {
	Anims []Anim
	// CelXY holds x and y source pixel coordinate pairs. for anim at index i, its
	// cels start at the sum of Anims[0..i-1].Cels * 2.
	CelXY []uint16
}

// an animation within an Atlas.
type Anim struct {
	//number of cels in a full animation cycle including cels extended for
	// duration and the second half of pingpongs.
	Cels uint8
	// clipbox / source area.
	W, H uint16
	// outgoing collision rectangle (red / blue). may be zero.
	Hitbox vmath.Box[uint16]
	// incoming collision rectangle (green / blue). may be zero.
	Hurtbox vmath.Box[uint16]
}
