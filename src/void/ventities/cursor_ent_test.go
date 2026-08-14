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

func setCursorXY(ent *CursorEnt, xy vgeo.XY[float32]) {
	ent.XY = xy
	ent.snapXY = xy
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
	setCursorXY(&ent, vgeo.NewXY[float32](10.5, 20.5))
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

func moveCursorKey(
	ent *CursorEnt, in *vin.In, dir vgeo.XY[int8], deltaSecs float64,
) {
	in.PrevDir = in.Dir
	in.Dir = dir
	ent.onCursorKey(in, int(dir.X), int(dir.Y), deltaSecs, defaultBounds)
}

func TestPhy(t *testing.T) {
	ent := testCursorEnt(10)
	ent.XY = vgeo.NewXY[float32](10, 20)
	ent.snapXY = vgeo.NewXY[float32](4, 8)
	layer := vgfx.NewLayerConfig(0)
	in := vin.NewIn()
	if _, on := ent.Phy(in, &layer); on {
		t.Fatal("hidden cursor without a pointer focused")
	}
	ent.Visible = true
	if got, on := ent.Phy(in, &layer); !on ||
		got != vgeo.NewXY[float32](4, 8) {
		t.Errorf("visible cursor Phy() = (%v, %v), want ((4,8), true)",
			got, on)
	}
	ent.Visible = false
	ent.KbdEnabled = true
	if _, on := ent.Phy(in, &layer); on {
		t.Fatal("hidden keyboard cursor without input focused")
	}
	ent.KbdEnabled = false
	poll := &vin.InputPoll{PtrsLen: 1}
	poll.Ptrs[0] = vin.PointerPoll{
		Device:  vin.PointerDeviceTouch,
		Primary: true,
	}
	in.Update(0, poll, vgeo.Box[float32]{})
	if got, on := ent.Phy(in, &layer); !on ||
		got != vgeo.NewXY[float32](4, 8) {
		t.Errorf("touch cursor Phy() = (%v, %v), want ((4,8), true)",
			got, on)
	}
}

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
	setCursorXY(&ent, vgeo.NewXY[float32](15, 0))
	ent.onCursorKey(vin.NewIn(), -1, 0, 1, bounds)
	if ent.XY.X != 10 {
		t.Fatalf("got X=%v, want 10", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMaxX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 50, 100)
	setCursorXY(&ent, vgeo.NewXY[float32](45, 0))
	ent.onCursorKey(vin.NewIn(), 1, 0, 1, bounds)
	if ent.XY.X != 50 {
		t.Fatalf("got X=%v, want 50", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMinY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 10, 100, 110)
	setCursorXY(&ent, vgeo.NewXY[float32](0, 15))
	ent.onCursorKey(vin.NewIn(), 0, -1, 1, bounds)
	if ent.XY.Y != 10 {
		t.Fatalf("got Y=%v, want 10", ent.XY.Y)
	}
}

func TestOnCursorKey_ClampsMaxY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 100, 50)
	setCursorXY(&ent, vgeo.NewXY[float32](0, 45))
	ent.onCursorKey(vin.NewIn(), 0, 1, 1, bounds)
	if ent.XY.Y != 50 {
		t.Fatalf("got Y=%v, want 50", ent.XY.Y)
	}
}

func TestOnCursorKey_SetsVisible(t *testing.T) {
	ent := testCursorEnt(100)
	ent.Visible = false
	ent.onCursorKey(vin.NewIn(), 1, 0, .1, defaultBounds)
	if !ent.Visible {
		t.Fatal("want visible after key move, got hidden")
	}
}

func TestOnCursorKey_SnapsDiagonal(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](.25, .75))
	in := vin.NewIn()
	ent.onCursorKey(in, 1, 1, .01, defaultBounds)
	if got, want := ent.snapXY, vgeo.NewXY[float32](1, 1); got != want {
		t.Errorf("first diagonal snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](1.1, 1.1); got != want {
		t.Errorf("first diagonal XY = %v, want %v", got, want)
	}
	in.PrevDir = vgeo.NewXY[int8](1, 1)
	ent.onCursorKey(in, 1, 1, .1, defaultBounds)
	if got, want := ent.snapXY, vgeo.NewXY[float32](2, 2); got != want {
		t.Errorf("second diagonal snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](2.1, 2.1); got != want {
		t.Errorf("second diagonal XY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_AccumulatesSubpixels(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .05)
	if got, want := ent.snapXY, vgeo.NewXY[float32](0, 0); got != want {
		t.Errorf("first half-pixel snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](.5, 0); got != want {
		t.Errorf("first half-pixel XY = %v, want %v", got, want)
	}
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .05)
	if got, want := ent.snapXY, vgeo.NewXY[float32](1, 0); got != want {
		t.Errorf("second half-pixel snapXY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_SyncsDiagonalAcrossDirectionChanges(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .1)
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 1), .1)
	if got, want := ent.XY, vgeo.NewXY[float32](2, 1); got != want {
		t.Errorf("diagonal XY = %v, want %v", got, want)
	}
	moveCursorKey(&ent, in, vgeo.NewXY[int8](0, 1), .1)
	if got, want := ent.XY, vgeo.NewXY[float32](2, 2); got != want {
		t.Errorf("vertical XY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_SlidesAtClipEdge(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](50, 0))
	in := vin.NewIn()
	clip := vgeo.NewBox[float32](0, 0, 100, 100)
	move := func(dir vgeo.XY[int8]) {
		in.PrevDir = in.Dir
		in.Dir = dir
		ent.onCursorKey(in, int(dir.X), int(dir.Y), .1, clip)
	}
	for range 10 {
		move(vgeo.NewXY[int8](-1, -1))
	}
	before := ent.snapXY
	move(vgeo.NewXY[int8](-1, 0))
	if got, want := ent.snapXY.X, before.X-1; got != want {
		t.Errorf("left after releasing up = %v, want %v", got, want)
	}
}

func TestOnCursorKey_RestartsAfterPoint(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](100, 100))
	ent.kbdOn = true
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(
		vgeo.NewXY[float32](.25, .75),
		vin.PointerDeviceMouse,
		&layer,
	)
	in := vin.NewIn()
	in.PrevDir = vgeo.NewXY[int8](1, 0)
	ent.onCursorKey(in, 1, 0, .01, defaultBounds)
	if got, want := ent.snapXY, vgeo.NewXY[float32](1, 1); got != want {
		t.Errorf("keyboard restart snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](1.1, 1); got != want {
		t.Errorf("keyboard restart XY = %v, want %v", got, want)
	}
}

func TestUpdate_KeyboardMode(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	ent.Update(in, &sprs, .1, &layer)
	if got := ent.XY.X; got != 0 {
		t.Errorf("disabled keyboard cursor X = %v, want 0", got)
	}
	ent.KbdEnabled = true
	ent.Update(in, &sprs, .1, &layer)
	if got := ent.XY.X; got != 1 {
		t.Errorf("enabled keyboard cursor X = %v, want 1", got)
	}
}

func TestUpdate_PointerLeaves(t *testing.T) {
	tests := []struct {
		name       string
		kbdEnabled bool
		want       bool
	}{
		{name: "pointer cursor", want: false},
		{name: "keyboard cursor", kbdEnabled: true, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := testCursorEnt(10)
			ent.KbdEnabled = test.kbdEnabled
			in := vin.NewIn()
			layer := vgfx.NewLayerConfig(0)
			sprs := []vgfx.Spr{}
			poll := &vin.InputPoll{PtrsLen: 1}
			poll.Ptrs[0] = vin.PointerPoll{
				Phy:     vgeo.NewBox[float32](4, 8, 4, 8),
				Device:  vin.PointerDeviceMouse,
				Primary: true,
			}
			in.Update(0, poll, vgeo.Box[float32]{})
			ent.Update(in, &sprs, 0, &layer)
			if !ent.Visible {
				t.Fatal("cursor hidden while mouse is present")
			}
			in.Update(1, &vin.InputPoll{}, vgeo.Box[float32]{})
			ent.Update(in, &sprs, 0, &layer)
			if ent.Visible != test.want {
				t.Errorf("cursor visible after mouse leaves = %v, want %v",
					ent.Visible, test.want)
			}
		})
	}
}

func TestUpdate_KeyboardModeFollowsMovedPointer(t *testing.T) {
	ent := testCursorEnt(10)
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.MapDefaultKeyboard()
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	update := func(now float64, x float32, keys vin.Key) {
		poll := &vin.InputPoll{
			Kbd:     vin.KeyboardPoll{Keys: keys},
			PtrsLen: 1,
		}
		poll.Ptrs[0] = vin.PointerPoll{
			Phy:     vgeo.NewBox(x, float32(0), x, float32(0)),
			Device:  vin.PointerDeviceMouse,
			Primary: true,
		}
		in.Update(now, poll, vgeo.Box[float32]{})
		ent.Update(in, &sprs, .1, &layer)
	}
	update(0, 2, 0)
	update(1, 2, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](3, 0); got != want {
		t.Errorf("stationary pointer keyboard XY = %v, want %v", got, want)
	}
	update(2, 20, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](20, 0); got != want {
		t.Errorf("moved pointer keyboard XY = %v, want %v", got, want)
	}
	update(3, 20, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](21, 0); got != want {
		t.Errorf("keyboard after moved pointer XY = %v, want %v", got, want)
	}
	ent.KbdEnabled = false
	update(4, 20, 0)
	if got, want := ent.XY, vgeo.NewXY[float32](21, 0); got != want {
		t.Errorf("disabled keyboard cursor XY = %v, want %v", got, want)
	}
	update(5, 8, 0)
	if got, want := ent.XY, vgeo.NewXY[float32](8, 0); got != want {
		t.Errorf("moved pointer keyboard XY = %v, want %v", got, want)
	}
}

func TestUpdate_KeyboardReleaseKeepsPosition(t *testing.T) {
	ent := testCursorEnt(10)
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	ent.Update(in, &sprs, .1, &layer)
	in.PrevDir = in.Dir
	in.Dir = vgeo.XY[int8]{}
	ent.Update(in, &sprs, .1, &layer)
	if got, want := ent.XY, vgeo.NewXY[float32](1, 0); got != want {
		t.Errorf("released keyboard cursor XY = %v, want %v", got, want)
	}
}
