package vgrid

import (
	"math"

	"github.com/oidoid/void/src/void/vgeo"
)

const noNode int32 = -1

type node struct {
	// caller-provided val. eg, an array index.
	v int32
	// next node index in this cell, or `empty`.
	next int32
}

// stores int32 values by spatial cell and visits each same-or-neighbor-cell
// pair exactly once.
type Grid struct {
	// first `nodes` index for each cell. padded by an `empty` border so neighbors
	// are always valid.
	heads []int32
	// all nodes, linked into per-cell chains by `node.next`.
	nodes  []node
	bounds vgeo.Box[float32]
	// cell size must be at least the max w/h.
	cellSize     float32
	halfCellSize float32
	// includes the half-cell offset for sprites on a boundary.
	cols int
	// includes the half-cell offset for sprites on a boundary.
	rows int
}

func New(
	bounds vgeo.Box[float32], cellSize float32, nodeCap int,
) Grid {
	halfCellSize := cellSize / 2
	cols := max(
		1,
		int(math.Ceil(float64((bounds.Max.X-bounds.Min.X+halfCellSize)/cellSize))),
	)
	rows := max(
		1,
		int(math.Ceil(float64((bounds.Max.Y-bounds.Min.Y+halfCellSize)/cellSize))),
	)
	this := Grid{
		bounds:       bounds,
		cellSize:     cellSize,
		halfCellSize: halfCellSize,
		cols:         cols,
		rows:         rows,
		heads:        make([]int32, (cols+2)*(rows+2)),
		nodes:        make([]node, 0, nodeCap),
	}
	this.Clear()
	return this
}

func (this *Grid) Clear() {
	for i := range this.heads {
		this.heads[i] = noNode
	}
	this.nodes = this.nodes[:0]
}

// adds val at xy and reports whether xy is inside bounds.
func (this *Grid) InsertAt(xy vgeo.XY[float32], v int32) bool {
	cell, ok := this.cellAt(xy)
	if !ok {
		return false
	}
	i := int32(len(this.nodes))
	head := this.heads[this.headIndex(cell)]
	this.nodes = append(this.nodes, node{v: v, next: head})
	this.heads[this.headIndex(cell)] = i
	return true
}

// calls fn for each same-or-neighbor-cell pair exactly once.
func (this *Grid) ForEach(fn func(l, r int32)) {
	for y := range this.rows {
		for x := range this.cols {
			cell := vgeo.XY[int]{X: x, Y: y}
			// intra-cell pairs.
			this.forEachCellPair(cell, cell, fn)

			// forward neighbor cells. these report each pair exactly once.
			this.forEachCellPair(cell, vgeo.XY[int]{X: x + 1, Y: y}, fn)
			this.forEachCellPair(cell, vgeo.XY[int]{X: x - 1, Y: y + 1}, fn)
			this.forEachCellPair(cell, vgeo.XY[int]{X: x, Y: y + 1}, fn)
			this.forEachCellPair(cell, vgeo.XY[int]{X: x + 1, Y: y + 1}, fn)
		}
	}
}

// gets cell at bounds coords.
func (this *Grid) cellAt(xy vgeo.XY[float32]) (vgeo.XY[int], bool) {
	cell := vgeo.XY[int]{
		X: int((xy.X - this.bounds.Min.X + this.halfCellSize) / this.cellSize),
		Y: int((xy.Y - this.bounds.Min.Y + this.halfCellSize) / this.cellSize),
	}
	if cell.X < 0 || cell.X >= this.cols || cell.Y < 0 || cell.Y >= this.rows {
		return vgeo.XY[int]{}, false
	}
	return cell, true
}

func (this *Grid) forEachCellPair(l, r vgeo.XY[int], fn func(l, r int32)) {
	for lNode := this.heads[this.headIndex(l)]; lNode != noNode; lNode = this.nodes[lNode].next {
		rNode := this.nodes[lNode].next
		if l != r {
			rNode = this.heads[this.headIndex(r)]
		}
		for ; rNode != noNode; rNode = this.nodes[rNode].next {
			fn(this.nodes[lNode].v, this.nodes[rNode].v)
		}
	}
}

func (this *Grid) headIndex(cell vgeo.XY[int]) int {
	return (cell.Y+1)*(this.cols+2) + cell.X + 1
}
