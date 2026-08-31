package vlevels

import (
	"github.com/oidoid/void/src/void/vgeo"
)

type Level struct {
	// pixel dimensions; divisible by the corresponding Tile dimension.
	vgeo.WH[int32]
	// cell dimensions in pixels.
	Tile vgeo.WH[uint8]
	// packed cells in row-major order; length is W/Tile.W*H/Tile.H, and zero
	// leaves a cell empty.
	Tiles []Tile
}

func (this *Level) HitsAt(xy vgeo.XY[int32]) bool {
	return this.TileAt(xy).Hits()
}

func (this *Level) TileAt(xy vgeo.XY[int32]) Tile {
	if xy.X < 0 || xy.X >= this.W || xy.Y < 0 || xy.Y >= this.H {
		return 0
	}
	tileW := int32(this.Tile.W)
	tileH := int32(this.Tile.H)
	tileCols := this.W / tileW
	return this.Tiles[xy.Y/tileH*tileCols+xy.X/tileW]
}
