package vboards

import (
	"github.com/oidoid/void/src/void/vgeo"
)

type Board struct {
	// pixel dimensions; divisible by the corresponding Tile dimension.
	vgeo.WH[int32]
	Level Level
	// cell dimensions in pixels.
	Tile vgeo.WH[uint8]
	// packed cells in row-major order; length is W/Tile.W*H/Tile.H, and zero
	// leaves a cell empty. use `SetTileAt()` to edit.
	Tiles []Tile
	// invalidated bounds in tile coordinates with exclusive max; zero means
	// clean. cleared at the start of each engine tick.
	Dirty vgeo.Box[int32]
}

type Level uint16

// checks inclusive pixel bounds; outside the board counts as a hit. check if
// box is empty if you care.
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
	i, ok := this.tileIndexAt(xy)
	if !ok {
		return 0
	}
	return this.Tiles[i]
}

// replace cell and return true if changed.
func (this *Board) SetTileAt(xy vgeo.XY[int32], tile Tile) bool {
	i, ok := this.tileIndexAt(xy)
	if !ok || this.Tiles[i] == tile {
		return false
	}
	this.Tiles[i] = tile
	x, y := xy.X/int32(this.Tile.W), xy.Y/int32(this.Tile.H)
	if this.Dirty.Max.X == 0 {
		this.Dirty = vgeo.XYWH(x, y, 1, 1)
	} else {
		this.Dirty.Min.X = min(this.Dirty.Min.X, x)
		this.Dirty.Min.Y = min(this.Dirty.Min.Y, y)
		this.Dirty.Max.X = max(this.Dirty.Max.X, x+1)
		this.Dirty.Max.Y = max(this.Dirty.Max.Y, y+1)
	}
	return true
}

func (this *Board) tileIndexAt(xy vgeo.XY[int32]) (int32, bool) {
	if xy.X < 0 || xy.X >= this.W || xy.Y < 0 || xy.Y >= this.H {
		return 0, false
	}
	tileW := int32(this.Tile.W)
	tileH := int32(this.Tile.H)
	tileCols := this.W / tileW
	return xy.Y/tileH*tileCols + xy.X/tileW, true
}
