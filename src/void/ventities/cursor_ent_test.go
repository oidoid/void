package ventities

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

func testCursorEnt(keyboard float32) CursorEnt {
	return NewCursorEnt(
		vatlas.AnimID(1), 0, keyboard, vgeo.Box[uint16]{}, vgfx.Z(0),
	)
}

func TestNewCursorEnt_Hitbox(t *testing.T) {
	hitbox := vgeo.XYWH[uint16](1, 2, 3, 4)
	ent := NewCursorEnt(vatlas.AnimID(1), 0, 0, hitbox, vgfx.Z(0))
	want := vgeo.XYWH[float32](1, 2, 3, 4)
	if ent.Hitbox != want {
		t.Fatalf("Hitbox = %v, want %v", ent.Hitbox, want)
	}
}

func TestUpdate_Hitbox(t *testing.T) {
	ent := NewCursorEnt(
		vatlas.AnimID(1), 0, 1, vgeo.XYWH[uint16](1, 2, 3, 4), vgfx.Z(0),
	)
	ent.XY = vgeo.NewXY[float32](10.5, 20.5)
	ent.Visible = true
	layer := vgfx.NewLayerConfig(0)
	sprs := []vgfx.Spr{}
	ent.Update(vin.NewIn(), &sprs, 0, &layer)
	want := vgeo.NewBox[float32](11.5, 22.5, 14.5, 26.5)
	if ent.Hitbox != want {
		t.Fatalf("Hitbox = %v, want %v", ent.Hitbox, want)
	}
}

var defaultBounds = vgeo.XYWH[float32](-100, -100, 1000, 1000)

func TestOnCursorPoint_SetsPosition(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(
		vgeo.NewXY[float32](104, 204),
		vin.PointerDeviceMouse,
		&layer,
	)
	if ent.XY.X != 104 || ent.XY.Y != 204 {
		t.Fatalf("got (%v, %v), want (104, 204)", ent.XY.X, ent.XY.Y)
	}
}

func TestOnCursorPoint_VisibleForMouse(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.XY[float32]{}, vin.PointerDeviceMouse, &layer)
	if !ent.Visible {
		t.Fatal("want visible for Mouse, got hidden")
	}
}

func TestOnCursorPoint_HiddenForTouch(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.XY[float32]{}, vin.PointerDeviceTouch, &layer)
	if ent.Visible {
		t.Fatal("want hidden for Touch, got visible")
	}
}

func TestOnCursorKey_ClampsMinX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](10, 0, 110, 100)
	ent.XY.X = 15
	ent.onCursorKey(vin.NewIn(), -1, 0, 1000, bounds)
	if ent.XY.X != 10 {
		t.Fatalf("got X=%v, want 10", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMaxX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 50, 100)
	ent.XY.X = 45
	ent.onCursorKey(vin.NewIn(), 1, 0, 1000, bounds)
	if ent.XY.X != 50 {
		t.Fatalf("got X=%v, want 50", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMinY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 10, 100, 110)
	ent.XY.Y = 15
	ent.onCursorKey(vin.NewIn(), 0, -1, 1000, bounds)
	if ent.XY.Y != 10 {
		t.Fatalf("got Y=%v, want 10", ent.XY.Y)
	}
}

func TestOnCursorKey_ClampsMaxY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 100, 50)
	ent.XY.Y = 45
	ent.onCursorKey(vin.NewIn(), 0, 1, 1000, bounds)
	if ent.XY.Y != 50 {
		t.Fatalf("got Y=%v, want 50", ent.XY.Y)
	}
}

func TestOnCursorKey_SetsVisible(t *testing.T) {
	ent := testCursorEnt(100)
	ent.Visible = false
	ent.onCursorKey(vin.NewIn(), 1, 0, 100, defaultBounds)
	if !ent.Visible {
		t.Fatal("want visible after key move, got hidden")
	}
}
