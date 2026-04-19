package void

import "github.com/oidoid/void/src/engine/geo"

type Tile = uint16

type Level struct {
	geo.Box[int16, uint16]
	Tile  geo.WH[uint8]
	Tiles []Tile
}
