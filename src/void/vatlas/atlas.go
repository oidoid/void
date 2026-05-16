package vatlas

import "github.com/oidoid/void/src/void/vmath"

// the number of cels every animation is padded to by repeating the sequence.
const CelsPerAnim = 16

// max animation loop duration in milliseconds.
const MaxAnimLoopMillis = 1000

// the duration of one cel in milliseconds (62.5).
const CelMillis = MaxAnimLoopMillis / CelsPerAnim

const (
	flagHitbox  = 1
	flagHurtbox = 2
)

type Atlas struct {
	Anims []Anim
	// cel subimages as XYWH.
	Cels []uint16
}

// builds an Atlas from the compact [srcX, srcY] pairs produced by the atlas
// packer.
func NewAtlas(anims []Anim, celXY []uint16) Atlas {
	cels := make([]uint16, len(anims)*CelsPerAnim*4)
	cellI := 0
	for animI, anim := range anims {
		for cel := 0; cel < CelsPerAnim; cel++ {
			wrap := cel % int(anim.Cels)
			u16 := (animI*CelsPerAnim + cel) * 4
			cels[u16+0] = celXY[cellI+wrap*2]
			cels[u16+1] = celXY[cellI+wrap*2+1]
			cels[u16+2] = anim.W
			cels[u16+3] = anim.H
		}
		cellI += int(anim.Cels) * 2
	}
	return Atlas{Anims: anims, Cels: cels}
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
