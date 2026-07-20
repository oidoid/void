package vlevels

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

type Level struct {
	vgeo.Box[int32]
	Tile  vgeo.WH[uint8]
	Tiles []vatlas.AnimID
}
