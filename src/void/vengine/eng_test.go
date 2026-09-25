package vengine

import (
	"testing"

	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
)

type engineTestGame struct {
	*Eng[*engineTestGame]
}

func TestFullscreenReq(t *testing.T) {
	engine := NewEng[*engineTestGame](nil)
	engine.ReqFullscreen(FullscreenReqEnter)
	want := int32(FullscreenReqEnter)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(FullscreenReqLandscape)
	want = int32(FullscreenReqLandscape)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(FullscreenReqPortrait)
	want = int32(FullscreenReqPortrait)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.Poll().Fullscreen = true
	engine.ReqFullscreen(FullscreenReqExit)
	if got := engine.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

func TestSetBoardExports(t *testing.T) {
	engine := NewEng[*engineTestGame](nil)
	assertBoardExport(t, engine, nil)

	first := &vboards.Board{
		Level: 1,
		WH:    vgeo.NewWH[int32](16, 8), Tile: vgeo.NewWH[uint8](8, 8),
		Tiles: []vboards.Tile{1, 2},
	}
	if !engine.SetBoard(first) {
		t.Fatal("SetBoard(first) = false, want true")
	}
	assertBoardExport(t, engine, first)

	// a same-sized board must be distinguishable even if an allocator could
	// reuse the old board's address.
	second := &vboards.Board{
		Level: 2,
		WH:    vgeo.NewWH[int32](16, 8), Tile: vgeo.NewWH[uint8](8, 8),
		Tiles: []vboards.Tile{3, 4},
	}
	if !engine.SetBoard(second) {
		t.Fatal("SetBoard(second) = false, want true")
	}
	assertBoardExport(t, engine, second)

	// re-setting the current level leaves engine state unchanged.
	if engine.SetBoard(second) {
		t.Error("SetBoard(second) = true on repeated level")
	}
	assertBoardExport(t, engine, second)
	sameLevel := &vboards.Board{Level: second.Level}
	if engine.SetBoard(sameLevel) {
		t.Error("SetBoard(sameLevel) = true on repeated level")
	}
	if engine.Board() != second {
		t.Error("SetBoard() replaced the current level with the same level")
	}

	changedDimensions := &vboards.Board{
		Level: 3,
		WH:    vgeo.NewWH[int32](12, 18), Tile: vgeo.NewWH[uint8](4, 6),
		Tiles: []vboards.Tile{1, 2, 3, 4, 5, 6, 7, 8, 9},
	}
	if !engine.SetBoard(changedDimensions) {
		t.Fatal("SetBoard(changedDimensions) = false, want true")
	}
	assertBoardExport(t, engine, changedDimensions)

	if !engine.SetBoard(nil) {
		t.Fatal("SetBoard(nil) = false, want true")
	}
	assertBoardExport(t, engine, nil)
}

func assertBoardExport(
	t *testing.T,
	engine *Eng[*engineTestGame],
	board *vboards.Board,
) {
	t.Helper()
	if board == nil {
		if engine.BoardLevel() != 0 || engine.BoardTilesPtr() != 0 ||
			engine.BoardTilesLen() != 0 ||
			engine.BoardW() != 0 || engine.BoardH() != 0 ||
			engine.BoardTileW() != 0 || engine.BoardTileH() != 0 {
			t.Error("nil board exports non-zero metadata")
		}
		return
	}
	if got := engine.BoardLevel(); got != uint16(board.Level) {
		t.Errorf("BoardLevel() = %v, want %v", got, board.Level)
	}
	if engine.BoardTilesPtr() == 0 {
		t.Error("BoardTilesPtr() = 0, want tile slice pointer")
	}
	if got := engine.BoardTilesLen(); got != uint32(len(board.Tiles)) {
		t.Errorf("BoardTilesLen() = %v, want %v", got, len(board.Tiles))
	}
	if got := engine.BoardW(); got != board.W {
		t.Errorf("BoardW() = %v, want %v", got, board.W)
	}
	if got := engine.BoardH(); got != board.H {
		t.Errorf("BoardH() = %v, want %v", got, board.H)
	}
	if got := engine.BoardTileW(); got != board.Tile.W {
		t.Errorf("BoardTileW() = %v, want %v", got, board.Tile.W)
	}
	if got := engine.BoardTileH(); got != board.Tile.H {
		t.Errorf("BoardTileH() = %v, want %v", got, board.Tile.H)
	}
}

func (*engineTestGame) Update() Status { return Pause }

// starts windowed and accepts an explicit override.
func TestFullscreenPlatformDefault(t *testing.T) {
	engine := NewEng[*engineTestGame](nil)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	engine.BeginTick()
	if got := engine.FullscreenReq(); got != int32(FullscreenReqNone) {
		t.Errorf("FullscreenReq() = %v, want none", got)
	}

	engine.Poll().FullscreenReq = FullscreenReqLandscape
	engine.BeginTick()
	if !engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = false, want true")
	}
	if got := engine.FullscreenReq(); got != int32(FullscreenReqLandscape) {
		t.Errorf("FullscreenReq() = %v, want landscape", got)
	}

	engine.ReqFullscreen(FullscreenReqExit)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := engine.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}
