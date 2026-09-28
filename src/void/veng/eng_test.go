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

func assertBoardExport(
	t *testing.T,
	eng *Eng,
	board *vboards.Board,
) {
	t.Helper()
	if board == nil {
		if eng.BoardLevel() != 0 || eng.BoardTilesPtr() != 0 ||
			eng.BoardTilesLen() != 0 ||
			eng.BoardW() != 0 || eng.BoardH() != 0 ||
			eng.BoardTileW() != 0 || eng.BoardTileH() != 0 {
			t.Error("nil board exports non-zero metadata")
		}
		return
	}
	if got := eng.BoardLevel(); got != uint16(board.Level) {
		t.Errorf("BoardLevel() = %v, want %v", got, board.Level)
	}
	if eng.BoardTilesPtr() == 0 {
		t.Error("BoardTilesPtr() = 0, want tile slice pointer")
	}
	if got := eng.BoardTilesLen(); got != uint32(len(board.Tiles)) {
		t.Errorf("BoardTilesLen() = %v, want %v", got, len(board.Tiles))
	}
	if got := eng.BoardW(); got != board.W {
		t.Errorf("BoardW() = %v, want %v", got, board.W)
	}
	if got := eng.BoardH(); got != board.H {
		t.Errorf("BoardH() = %v, want %v", got, board.H)
	}
	if got := eng.BoardTileW(); got != board.Tile.W {
		t.Errorf("BoardTileW() = %v, want %v", got, board.Tile.W)
	}
	if got := eng.BoardTileH(); got != board.Tile.H {
		t.Errorf("BoardTileH() = %v, want %v", got, board.Tile.H)
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
