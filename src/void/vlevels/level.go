package vlevels

import "github.com/oidoid/void/src/void/vmath"

type Tile = uint16

type Level struct {
	vmath.Box[int16]
	Tile  vmath.WH[uint8]
	Tiles []Tile
}
