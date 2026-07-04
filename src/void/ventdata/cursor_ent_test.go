package ventdata

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vinput"
)

func testCursorEnt(keyboard float32) CursorEnt {
	return NewCursorEnt(vatlas.AnimID(1), 0, keyboard, vgfx.Z(0))
}

var defaultBounds = vgeo.NewBox[float32](-100, -100, 900, 900)

func TestOnCursorPoint_SetsPosition(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(
		vgeo.NewBox[float32](100, 200, 108, 208),
		vinput.PointerDeviceMouse,
		&layer,
	)
	if ent.XY.X != 100 || ent.XY.Y != 200 {
		t.Fatalf("got (%v, %v), want (100, 200)", ent.XY.X, ent.XY.Y)
	}
}

func TestOnCursorPoint_VisibleForMouse(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.Box[float32]{}, vinput.PointerDeviceMouse, &layer)
	if !ent.Visible {
		t.Fatal("want visible for Mouse, got hidden")
	}
}

func TestOnCursorPoint_HiddenForTouch(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.Box[float32]{}, vinput.PointerDeviceTouch, &layer)
	if ent.Visible {
		t.Fatal("want hidden for Touch, got visible")
	}
}

func TestOnCursorKey_ClampsMinX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](10, 0, 110, 100)
	ent.XY.X = 15
	ent.onCursorKey(-1, 0, 1000, bounds)
	if ent.XY.X != 10 {
		t.Fatalf("got X=%v, want 10", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMaxX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 50, 100)
	ent.XY.X = 45
	ent.onCursorKey(1, 0, 1000, bounds)
	if ent.XY.X != 50 {
		t.Fatalf("got X=%v, want 50", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMinY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 10, 100, 110)
	ent.XY.Y = 15
	ent.onCursorKey(0, -1, 1000, bounds)
	if ent.XY.Y != 10 {
		t.Fatalf("got Y=%v, want 10", ent.XY.Y)
	}
}

func TestOnCursorKey_ClampsMaxY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 100, 50)
	ent.XY.Y = 45
	ent.onCursorKey(0, 1, 1000, bounds)
	if ent.XY.Y != 50 {
		t.Fatalf("got Y=%v, want 50", ent.XY.Y)
	}
}

func TestOnCursorKey_SetsVisible(t *testing.T) {
	ent := testCursorEnt(100)
	ent.Visible = false
	ent.onCursorKey(1, 0, 100, defaultBounds)
	if !ent.Visible {
		t.Fatal("want visible after key move, got hidden")
	}
}
