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
	if out.BoardTilesPtr == 0 {
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
