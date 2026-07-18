package vgrid

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

var testBounds = vgeo.NewBox(
	float32(-45), float32(-45), float32(55), float32(55),
)

func TestGridInsert(t *testing.T) {
	tests := []struct {
		name string
		vals []vgeo.XY[float32]
	}{
		{name: "empty grid yields no pairs"},
		{name: "single ent yields no pairs", vals: []vgeo.XY[float32]{xy(5, 5)}},
		{
			name: "out-of-bounds ents are dropped",
			vals: []vgeo.XY[float32]{xy(200, 200), xy(200, 200), xy(200, 200)},
		},
		{
			name: "negative-coordinate ents are in bounds",
			vals: []vgeo.XY[float32]{xy(-1, -1)},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			grid := newGrid()
			for i, val := range test.vals {
				grid.InsertAt(val, int32(i))
			}
			if got := pairs(&grid); len(got) != 0 {
				t.Errorf("pairs = %v, want none", got)
			}
		})
	}
}

func TestGridSameCell(t *testing.T) {
	tests := []struct {
		name string
		vals []vgeo.XY[float32]
		want int
	}{
		{
			name: "two ents produce one pair",
			vals: []vgeo.XY[float32]{xy(5, 5), xy(6, 6)},
			want: 1,
		},
		{
			name: "three ents produce three pairs",
			vals: []vgeo.XY[float32]{xy(5, 5), xy(6, 6), xy(7, 7)},
			want: 3,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			grid := newGrid()
			for i, val := range test.vals {
				grid.InsertAt(val, int32(i))
			}
			if got := len(pairs(&grid)); got != test.want {
				t.Errorf("pair count = %d, want %d", got, test.want)
			}
		})
	}
}

func TestGridAdjacentCells(t *testing.T) {
	tests := []struct {
		name string
		xy   vgeo.XY[float32]
	}{
		{name: "above-left", xy: xy(-5, -5)},
		{name: "above", xy: xy(5, -5)},
		{name: "above-right", xy: xy(15, -5)},
		{name: "left", xy: xy(-5, 5)},
		{name: "same", xy: xy(5, 5)},
		{name: "right", xy: xy(15, 5)},
		{name: "below-left", xy: xy(-5, 15)},
		{name: "below", xy: xy(5, 15)},
		{name: "below-right", xy: xy(15, 15)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			grid := newGrid()
			grid.InsertAt(xy(5, 5), 0)
			grid.InsertAt(test.xy, 1)
			if got := len(pairs(&grid)); got != 1 {
				t.Errorf("pair count = %d, want 1", got)
			}
		})
	}
}

func TestGridNoSpuriousPairs(t *testing.T) {
	t.Run("ents two cells apart produce no pairs", func(t *testing.T) {
		grid := newGrid()
		grid.InsertAt(xy(5, 5), 0)  // cell (5, 5).
		grid.InsertAt(xy(25, 5), 1) // cell (5, 7).
		if got := len(pairs(&grid)); got != 0 {
			t.Errorf("pair count = %d, want 0", got)
		}
	})
	t.Run("border cells produce no pairs with center", func(t *testing.T) {
		// A in cell (5, 5). border cells are those at row or col 3 or 7, two
		// cells away, and should never pair with A.
		//                            row
		//      ┌───┬───┬───┬───┬───┐
		//      │ · │ · │ · │ · │ · │ 3
		//      ├───┼───┼───┼───┼───┤
		//      │ · │   │   │   │ · │ 4
		//      ├───┼───┼───┼───┼───┤
		//      │ · │   │ A │   │ · │ 5
		//      ├───┼───┼───┼───┼───┤
		//      │ · │   │   │   │ · │ 6
		//      ├───┼───┼───┼───┼───┤
		//      │ · │ · │ · │ · │ · │ 7
		//      └───┴───┴───┴───┴───┘
		//  col   3   4   5   6   7
		grid := newGrid()
		vals := []vgeo.XY[float32]{
			xy(-15, -15), xy(-5, -15), xy(5, -15), xy(15, -15), xy(25, -15), // row 3
			xy(-15, -5), xy(-15, 5), xy(-15, 15), // col 3
			xy(25, -5), xy(25, 5), xy(25, 15), // col 7
			xy(-15, 25), xy(-5, 25), xy(5, 25), xy(15, 25),
			xy(25, 25), // row 7
		}
		for i, val := range vals {
			grid.InsertAt(val, int32(i))
		}
		const center = int32(16)
		grid.InsertAt(xy(5, 5), center) // cell (5, 5).
		for _, pair := range pairs(&grid) {
			if pair[0] == center || pair[1] == center {
				t.Errorf("unexpected center pair %v", pair)
			}
		}
	})
	t.Run("each pair reported exactly once", func(t *testing.T) {
		grid := newGrid()
		vals := []vgeo.XY[float32]{
			xy(5, 5),  // cell (5, 5).
			xy(14, 5), // cell (5, 6).
			xy(15, 5), // cell (5, 6).
		}
		for i, val := range vals {
			grid.InsertAt(val, int32(i))
		}
		assertUniquePairs(t, pairs(&grid), 3)
	})
	t.Run("nonzero origin shifts bucketing correctly", func(t *testing.T) {
		grid := New(vgeo.NewBox(
			float32(50), float32(50), float32(150), float32(150),
		), 10, 16)
		vals := []vgeo.XY[float32]{
			xy(55, 55), // cell (1, 1).
			xy(65, 55), // cell (1, 2). adjacent.
			xy(80, 55), // cell (1, 3). two away from the first.
		}
		for i, val := range vals {
			grid.InsertAt(val, int32(i))
		}
		if got := len(pairs(&grid)); got != 2 {
			t.Errorf("pair count = %d, want 2", got)
		}
	})
	t.Run("4 by 4 grid reports 42 unique pairs", func(t *testing.T) {
		grid := New(vgeo.NewBox(
			float32(0), float32(0), float32(40), float32(40),
		), 10, 16)
		// cell layout (row-major):
		//  0  1  2  3
		//  4  5  6  7
		//  8  9  a  b
		//  c  d  e  f
		// scenario: when processing cell 5 we check 5 vs 6, 8, 9, a (forward
		// neighbors). when we later process cell 9 its forward neighbors are a,
		// c, d, e; not 5. so (5, 9) must appear exactly once.
		for i := range 16 {
			grid.InsertAt(xy(float32(i%4*10), float32(i/4*10)), int32(i))
		}
		// 12 right + 12 below + 9 below-right + 9 below-left = 42 total pairs.
		assertUniquePairs(t, pairs(&grid), 42)
	})
}

func newGrid() Grid { return New(testBounds, 10, 16) }

func pairs(grid *Grid) [][2]int32 {
	vals := make([][2]int32, 0)
	grid.ForEach(func(a, b int32) {
		vals = append(vals, [2]int32{a, b})
	})
	return vals
}

func assertUniquePairs(t *testing.T, pairs [][2]int32, want int) {
	t.Helper()
	seen := make(map[[2]int32]bool, len(pairs))
	for _, pair := range pairs {
		if pair[0] > pair[1] {
			pair[0], pair[1] = pair[1], pair[0]
		}
		if seen[pair] {
			t.Errorf("duplicate pair %v", pair)
		}
		seen[pair] = true
	}
	if got := len(pairs); got != want {
		t.Errorf("pair count = %d, want %d", got, want)
	}
}

func xy(x, y float32) vgeo.XY[float32] {
	return vgeo.NewXY(x, y)
}
