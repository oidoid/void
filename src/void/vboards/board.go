package vboards

import (
	"github.com/oidoid/void/src/void/vgeo"
)

type Board struct {
	Level Level
	// pixel dimensions; divisible by the corresponding Tile dimension.
	vgeo.WH[int32]
	// cell dimensions in pixels.
	Tile vgeo.WH[uint8]
	// packed cells in row-major order; length is W/Tile.W*H/Tile.H, and zero
	// leaves a cell empty.
	Tiles []Tile
}

type Level uint16

// checks inclusive pixel bounds; outside the board counts as a hit.
func (this *Board) HitsBox(box vgeo.Box[float32]) bool {
	if box.Min.X < 0 ||
		box.Min.Y < 0 ||
		box.Max.X >= float32(this.W) ||
		box.Max.Y >= float32(this.H) {
		return true
	}
	tileW, tileH := int32(this.Tile.W), int32(this.Tile.H)
	minX, maxX := int32(box.Min.X)/tileW, int32(box.Max.X)/tileW
	minY, maxY := int32(box.Min.Y)/tileH, int32(box.Max.Y)/tileH
	cols := this.W / tileW
	for y := minY; y <= maxY; y++ {
		for x := minX; x <= maxX; x++ {
			if this.Tiles[y*cols+x].Hits() {
				return true
			}
		}
	}
	return false
}

func (this *Board) HitsXY(xy vgeo.XY[int32]) bool {
	return this.TileAt(xy).Hits()
}

func (this *Board) TileAt(xy vgeo.XY[int32]) Tile {
	if xy.X < 0 || xy.X >= this.W || xy.Y < 0 || xy.Y >= this.H {
		return 0
	}
	tileW := int32(this.Tile.W)
	tileH := int32(this.Tile.H)
	tileCols := this.W / tileW
	return this.Tiles[xy.Y/tileH*tileCols+xy.X/tileW]
}
