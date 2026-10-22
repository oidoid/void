package veng

import (
	"testing"

	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestFullscreenReq(t *testing.T) {
	eng := NewEng(nil)
	eng.ReqFullscreen(FullscreenReqEnter)
	want := int32(FullscreenReqEnter)
	if got := eng.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	eng.ReqFullscreen(FullscreenReqLandscape)
	want = int32(FullscreenReqLandscape)
	if got := eng.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	eng.ReqFullscreen(FullscreenReqPortrait)
	want = int32(FullscreenReqPortrait)
	if got := eng.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	eng.Poll().Fullscreen = true
	eng.ReqFullscreen(FullscreenReqExit)
	if got := eng.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

func TestSetBoardExports(t *testing.T) {
	eng := NewEng(nil)
	assertBoardExport(t, eng, nil)

	first := &vboards.Board{
		Level: 1,
		WH:    vgeo.NewWH[int32](16, 8), Tile: vgeo.NewWH[uint8](8, 8),
		Tiles: []vboards.Tile{1, 2},
	}
	if !eng.SetBoard(first) {
		t.Fatal("SetBoard(first) = false, want true")
	}
	assertBoardExport(t, eng, first)

	// a same-sized board must be distinguishable even if an allocator could
	// reuse the old board's address.
	second := &vboards.Board{
		Level: 2,
		WH:    vgeo.NewWH[int32](16, 8), Tile: vgeo.NewWH[uint8](8, 8),
		Tiles: []vboards.Tile{3, 4},
	}
	if !eng.SetBoard(second) {
		t.Fatal("SetBoard(second) = false, want true")
	}
	assertBoardExport(t, eng, second)

	// re-setting the current level leaves engine state unchanged.
	if eng.SetBoard(second) {
		t.Error("SetBoard(second) = true on repeated level")
	}
	assertBoardExport(t, eng, second)
	sameLevel := &vboards.Board{Level: second.Level}
	if eng.SetBoard(sameLevel) {
		t.Error("SetBoard(sameLevel) = true on repeated level")
	}
	if eng.Board() != second {
		t.Error("SetBoard() replaced the current level with the same level")
	}

	changedDimensions := &vboards.Board{
		Level: 3,
		WH:    vgeo.NewWH[int32](12, 18), Tile: vgeo.NewWH[uint8](4, 6),
		Tiles: []vboards.Tile{1, 2, 3, 4, 5, 6, 7, 8, 9},
	}
	if !eng.SetBoard(changedDimensions) {
		t.Fatal("SetBoard(changedDimensions) = false, want true")
	}
	assertBoardExport(t, eng, changedDimensions)

	if !eng.SetBoard(nil) {
		t.Fatal("SetBoard(nil) = false, want true")
	}
	assertBoardExport(t, eng, nil)
}

func TestBoardTileChangesExport(t *testing.T) {
	board := &vboards.Board{
		Level: 1,
		WH:    vgeo.NewWH[int32](8, 4), Tile: vgeo.NewWH[uint8](4, 4),
		Tiles: []vboards.Tile{1, 2},
	}
	eng := NewEng(&EngOpts{Board: board, MaxSprs: 1})
	eng.OutPtr()
	ptr := eng.out.BoardTilesPtr
	xy := vgeo.NewXY[int32](4, 0)
	for _, tile := range []vboards.Tile{vboards.NewTile(3, true), 0} {
		eng.BeginTick()
		board.SetTileAt(xy, tile)
		eng.EndTick(Pause)
		if eng.out.BoardTilesPtr != ptr || eng.out.BoardLevel != 1 {
			t.Error("tile change replaced the board's storage or level")
		}
		assertBoardExport(t, eng, board)
		if board.Dirty != vgeo.XYWH[int32](1, 0, 1, 1) {
			t.Fatal("EndTick() lost this tick's invalidated bounds")
		}
		eng.BeginTick()
		eng.EndTick(Pause)
		if board.Dirty != (vgeo.Box[int32]{}) {
			t.Error("BeginTick() did not clear the previous invalidated bounds")
		}
		if board.TileAt(xy) != tile {
			t.Error("BeginTick() changed the tile data")
		}
	}
	eng.SetBoard(nil)
	assertBoardExport(t, eng, nil)
}

func TestSetBoardInvalidatesTiles(t *testing.T) {
	first := &vboards.Board{
		Level: 1,
		WH:    vgeo.NewWH[int32](20, 9), Tile: vgeo.NewWH[uint8](4, 3),
		Tiles: make([]vboards.Tile, 15),
	}
	second := &vboards.Board{
		Level: 2,
		WH:    vgeo.NewWH[int32](20, 9), Tile: vgeo.NewWH[uint8](4, 3),
		Tiles: make([]vboards.Tile, 15),
		Dirty: vgeo.XYWH[int32](2, 1, 1, 1),
	}
	empty := &vboards.Board{Level: 3}
	eng := NewEng(&EngOpts{Board: first, MaxSprs: 1})
	eng.OutPtr()
	full := vgeo.XYWH[int32](0, 0, 5, 3)
	if eng.out.BoardDirty != full {
		t.Fatalf("initial dirty box = %v, want %v", eng.out.BoardDirty, full)
	}
	for _, test := range []struct {
		name    string
		board   *vboards.Board
		changed bool
		want    vgeo.Box[int32]
	}{
		{"current board", first, false, vgeo.Box[int32]{}},
		{"same size", second, true, full},
		{"return to first", first, true, full},
		{"empty board", empty, true, vgeo.XYWH[int32](0, 0, 1, 1)},
		{"remove board", nil, true, vgeo.XYWH[int32](0, 0, 1, 1)},
		{"already removed", nil, false, vgeo.Box[int32]{}},
	} {
		t.Run(test.name, func(t *testing.T) {
			eng.BeginTick()
			if got := eng.SetBoard(test.board); got != test.changed {
				t.Fatalf("SetBoard() = %v, want %v", got, test.changed)
			}
			eng.EndTick(Pause)
			assertBoardExport(t, eng, test.board)
			if got := eng.out.BoardDirty; got != test.want {
				t.Fatalf("exported dirty box = %v, want %v", got, test.want)
			}
		})
	}
}

func TestBoardDirtyBoxTickLifecycle(t *testing.T) {
	board := &vboards.Board{
		Level: 7,
		WH:    vgeo.NewWH[int32](12, 9), Tile: vgeo.NewWH[uint8](4, 3),
		Tiles: make([]vboards.Tile, 9),
	}
	eng := NewEng(&EngOpts{Board: board, MaxSprs: 1})
	eng.BeginTick()
	board.SetTileAt(vgeo.NewXY[int32](0, 0), 1)
	board.SetTileAt(vgeo.NewXY[int32](11, 8), 2)
	want := vgeo.XYWH[int32](0, 0, 3, 3)
	eng.EndTick(Pause)
	assertBoardExport(t, eng, board)
	if board.Dirty != want {
		t.Fatalf("invalidated bounds = %v, want %v", board.Dirty, want)
	}
	eng.OutPtr()
	if board.Dirty != want {
		t.Fatal("reading the output cleared this tick's invalidated bounds")
	}
	eng.BeginTick()
	if board.Dirty != (vgeo.Box[int32]{}) {
		t.Fatal("BeginTick() did not clear the previous invalidated bounds")
	}
	board.SetTileAt(vgeo.NewXY[int32](5, 4), 3)
	eng.EndTick(Pause)
	assertBoardExport(t, eng, board)
	if board.Dirty != vgeo.XYWH[int32](1, 1, 1, 1) {
		t.Fatalf("new edit retained old bounds: %v", board.Dirty)
	}
	eng.BeginTick()
	board.SetTileAt(vgeo.NewXY[int32](5, 4), 4)
	eng.EndTick(Pause)
	if board.Dirty != vgeo.XYWH[int32](1, 1, 1, 1) {
		t.Fatal("another edit in the same box was lost")
	}
	eng.BeginTick()
	eng.EndTick(Pause)
	if board.Dirty != (vgeo.Box[int32]{}) {
		t.Fatal("a tick without edits retained old invalidated bounds")
	}
	eng.SetBoard(nil)
	eng.BeginTick()
	eng.EndTick(Pause)
	assertBoardExport(t, eng, nil)
}

func assertBoardExport(
	t *testing.T,
	eng *Eng,
	board *vboards.Board,
) {
	t.Helper()
	eng.OutPtr()
	out := &eng.out
	if board == nil {
		if out.BoardLevel != 0 || out.BoardTilesPtr != 0 ||
			out.BoardTilesLen != 0 ||
			out.BoardW != 0 || out.BoardH != 0 ||
			out.BoardTileW != 0 || out.BoardTileH != 0 {
			t.Error("nil board exports non-zero metadata")
		}
		return
	}
	if got := out.BoardLevel; got != uint16(board.Level) {
		t.Errorf("out.BoardLevel = %v, want %v", got, board.Level)
	}
	if got := out.BoardDirty; got != board.Dirty {
		t.Errorf("out.BoardDirty = %v, want %v", got, board.Dirty)
	}
	if len(board.Tiles) != 0 && out.BoardTilesPtr == 0 {
		t.Error("out.BoardTilesPtr = 0, want tile slice pointer")
	}
	if got := out.BoardTilesLen; got != uint32(len(board.Tiles)) {
		t.Errorf("out.BoardTilesLen = %v, want %v", got, len(board.Tiles))
	}
	if got := out.BoardW; got != board.W {
		t.Errorf("out.BoardW = %v, want %v", got, board.W)
	}
	if got := out.BoardH; got != board.H {
		t.Errorf("out.BoardH = %v, want %v", got, board.H)
	}
	if got := out.BoardTileW; got != board.Tile.W {
		t.Errorf("out.BoardTileW = %v, want %v", got, board.Tile.W)
	}
	if got := out.BoardTileH; got != board.Tile.H {
		t.Errorf("out.BoardTileH = %v, want %v", got, board.Tile.H)
	}
}

// starts windowed and accepts an explicit override.
func TestFullscreenPlatformDefault(t *testing.T) {
	eng := NewEng(nil)
	if eng.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	eng.BeginTick()
	if got := eng.FullscreenReq(); got != int32(FullscreenReqNone) {
		t.Errorf("FullscreenReq() = %v, want none", got)
	}

	eng.Poll().FullscreenReq = FullscreenReqLandscape
	eng.BeginTick()
	if eng.Poll().FullscreenReq != FullscreenReqLandscape {
		t.Error("BeginTick() changed browser-owned input")
	}
	if !eng.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = false, want true")
	}
	if got := eng.FullscreenReq(); got != int32(FullscreenReqLandscape) {
		t.Errorf("FullscreenReq() = %v, want landscape", got)
	}

	eng.ReqFullscreen(FullscreenReqExit)
	if eng.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := eng.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}
