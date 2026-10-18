package vatlas

import "github.com/oidoid/void/src/void/vgeo"

const (
	MaxCels   = uint8(255)
	MaxRepeat = uint8(255)
)

// static animation metadata.
type TagMeta struct {
	// atlas-wide index of this tag's first authored cel in Atlas.Cels.
	CelIndex uint16
	Cels     uint8 // number of cels in animation.
	Dir      AnimDir
	// 0 loops indefinitely; 1..255 counts repeats (each ping-pong leg).
	Repeat uint8
	vgeo.WH[uint16]
	// inclusive outgoing collision bounds (red / blue). zero disables.
	Hitbox vgeo.Box[uint16]
	// inclusive incoming collision bounds (green / blue). zero disables.
	Hurtbox vgeo.Box[uint16]
}
