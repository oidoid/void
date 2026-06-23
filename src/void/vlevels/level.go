package vlevels

import "github.com/oidoid/void/src/void/vgeo"

type Tile = uint16

type Level struct {
	vgeo.Box[int32]
	Tile  vgeo.WH[uint8]
	Tiles []Tile
}
