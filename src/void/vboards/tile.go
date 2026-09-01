package vboards

import (
	"github.com/oidoid/void/src/void/vatlas"
)

// packed board cell with an atlas tag and gameplay flags.
type Tile uint16

const (
	tileTagShift  = 0
	tileTagMask   = vatlas.MaxTags - 1
	tileHitsShift = 12
	tileHitsMask  = 1
)

func NewTile(tag vatlas.Tag, hits bool) Tile {
	this := Tile(tag) << tileTagShift
	if hits {
		this |= tileHitsMask << tileHitsShift
	}
	return this
}

func (this Tile) Tag() vatlas.Tag {
	return vatlas.Tag(this >> tileTagShift & tileTagMask)
}

func (this Tile) Hits() bool {
	return this>>tileHitsShift&tileHitsMask != 0
}
