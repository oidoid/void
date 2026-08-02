package vgrid

import (
	"math"

	"github.com/oidoid/void/src/void/vgeo"
)

const noNode int32 = -1

type node struct {
	// caller-provided val. eg, an array index.
	v int32
	// neighbor node indices or noNode.
	prev, next int32
}

// stores int32 values by spatial cell and visits each same-or-neighbor-cell
// pair exactly once. vals are the top-left corner of a box no larger than a
// cell, so on read a box can only reach its own cell or the right, down, and
// down-right neighbors. if the caller reports a pair resolved, both vals are
// dropped from all further pairs for the remainder of the pass.
type Grid struct {
	// first nodes index for each cell, or `noNode`.
	heads []int32
	// all nodes, linked into per-cell chains by node.next.
	nodes  []node
	bounds vgeo.Box[float32]
	// cell size must be at least the max w/h.
	cellSize float32
	cols     int
	rows     int
	// cols+1. reserves a col so right/down-right neighbors of the last col always
	// index a valid, empty cell.
	stride int
}

func New(bounds vgeo.Box[float32], cellSize float32, nodeCap int) Grid {
	cols := max(
		1, int(math.Ceil(float64(bounds.Max.X-bounds.Min.X)/float64(cellSize))),
	)
	rows := max(
		1, int(math.Ceil(float64(bounds.Max.Y-bounds.Min.Y)/float64(cellSize))),
	)
	stride := cols + 1
	this := Grid{
		bounds:   bounds,
		cellSize: cellSize,
		cols:     cols,
		rows:     rows,
		stride:   stride,
		// +1 row reserves down/down-right neighbors of the last row.
		heads: make([]int32, stride*(rows+1)),
		nodes: make([]node, 0, nodeCap),
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
	cellIdx, ok := this.cellIdxAt(xy)
	if !ok {
		return false
	}
	i := int32(len(this.nodes))
	head := this.heads[cellIdx]
	this.nodes = append(this.nodes, node{v: v, prev: noNode, next: head})
	if head != noNode {
		this.nodes[head].prev = i
	}
	this.heads[cellIdx] = i
	return true
}

// calls fn for each same-or-neighbor-cell pair exactly once. if fn reports
// the pair resolved, l and r are skipped for the rest of the pass.
func (this *Grid) ForEach(fn func(l, r int32) (resolved bool)) {
	for y := range this.rows {
		row := y * this.stride
		for x := range this.cols {
			cellIdx := row + x
			this.pairsWithin(cellIdx, fn)
			this.pairsAcross(cellIdx, cellIdx+1, fn)             // right.
			this.pairsAcross(cellIdx, cellIdx+this.stride, fn)   // down.
			this.pairsAcross(cellIdx, cellIdx+this.stride+1, fn) // down-right.
		}
	}
}

// gets cell index at bounds coords.
func (this *Grid) cellIdxAt(xy vgeo.XY[float32]) (int, bool) {
	if xy.X < this.bounds.Min.X || xy.X > this.bounds.Max.X ||
		xy.Y < this.bounds.Min.Y || xy.Y > this.bounds.Max.Y {
		return 0, false
	}
	// safe to truncate instead of floor: both operands are non-negative.
	x := min(this.cols-1, int((xy.X-this.bounds.Min.X)/this.cellSize))
	y := min(this.rows-1, int((xy.Y-this.bounds.Min.Y)/this.cellSize))
	return y*this.stride + x, true
}

// reports every unique pair within one cell's chain, unlinking both vals of
// any resolved pair.
func (this *Grid) pairsWithin(cellIdx int, fn func(l, r int32) bool) {
	l := this.heads[cellIdx]
	for l != noNode {
		// captured before fn can mutate the chain via unlink.
		nextL := this.nodes[l].next
		lv := this.nodes[l].v
		for r := nextL; r != noNode; r = this.nodes[r].next {
			rNext := this.nodes[r].next
			if fn(lv, this.nodes[r].v) {
				if r == nextL {
					nextL = rNext
				}
				this.unlink(r, cellIdx)
				this.unlink(l, cellIdx)
				break
			}
		}
		l = nextL
	}
}

// reports every pair between two distinct cells' chains, unlinking both vals
// of any resolved pair.
func (this *Grid) pairsAcross(lCellIdx, rCellIdx int, fn func(l, r int32) bool) {
	l := this.heads[lCellIdx]
	for l != noNode {
		// captured before fn can mutate the chain via unlink.
		nextL := this.nodes[l].next
		lv := this.nodes[l].v
		for r := this.heads[rCellIdx]; r != noNode; r = this.nodes[r].next {
			if fn(lv, this.nodes[r].v) {
				this.unlink(r, rCellIdx)
				this.unlink(l, lCellIdx)
				break
			}
		}
		l = nextL
	}
}

// removes node i, in cellIdx's chain, in O(1).
func (this *Grid) unlink(i int32, cellIdx int) {
	n := this.nodes[i]
	if n.prev == noNode {
		this.heads[cellIdx] = n.next
	} else {
		this.nodes[n.prev].next = n.next
	}
	if n.next != noNode {
		this.nodes[n.next].prev = n.prev
	}
}
