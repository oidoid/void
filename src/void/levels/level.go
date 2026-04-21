package levels

import "github.com/oidoid/void/src/void/math"

type Tile = uint16

type Level struct {
	math.Box[int16, uint16]
	Tile  math.WH[uint8]
	Tiles []Tile
}
