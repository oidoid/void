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

func (this *Level) TileAt(xy vgeo.XY[int32]) vatlas.AnimID {
	if xy.X < this.Min.X || xy.X >= this.Max.X ||
		xy.Y < this.Min.Y || xy.Y >= this.Max.Y {
		return 0
	}
	tileW := int32(this.Tile.W)
	tileH := int32(this.Tile.H)
	tileCols := (this.W() + tileW - 1) / tileW
	tileX := (xy.X - this.Min.X) / tileW
	tileY := (xy.Y - this.Min.Y) / tileH
	return this.Tiles[tileY*tileCols+tileX]
}
