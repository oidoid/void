package vin

import (
	"math"
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

var zeroCam = vgeo.Box[float32]{}

func xyNear(l, r vgeo.XY[float32]) bool {
	const epsilon = .0001
	return math.Abs(float64(l.X-r.X)) < epsilon &&
		math.Abs(float64(l.Y-r.Y)) < epsilon
}

func TestIsHeld(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)

	in.Update(10, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)

	in.Update(309, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsHeld() {
		t.Error("held should be false before MinHeldMillis")
	}

	in.Update(310, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis")
	}

	in.Update(1000, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should remain true after MinHeldMillis")
	}

	in.Update(1001, &InPoll{}, zeroCam)
	if in.IsHeld() {
		t.Error("held should reset when off")
	}

	in.Update(1002, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsHeld() {
		t.Error("held should remain off before MinHeldMillis")
	}

	in.Update(1302, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis again")
	}

	in.Update(1303, &InPoll{}, zeroCam)
	if in.IsHeld() {
		t.Error("held should reset when off")
	}

	in.Update(1603, &InPoll{}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis of unchanging input")
	}
}

func TestIsOff(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if !in.IsOff(ButtonA) {
		t.Error("IsOff should be true when button is off")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOff(ButtonA) {
		t.Error("IsOff should be false when button is on")
	}

	in.Update(10, &InPoll{}, zeroCam)
	if !in.IsOff(ButtonA) {
		t.Error("IsOff should be true when button is off again")
	}
}

func TestIsOffStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should be false while button is on")
	}

	in.Update(1, &InPoll{}, zeroCam)
	if !in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should be true when button turns off")
	}

	in.Update(2, &InPoll{}, zeroCam)
	if in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should not repeat while button remains off")
	}
}

func TestIsOffEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should be false while button is off")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should be true when button turns on")
	}

	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should not repeat while button remains on")
	}
}

func TestIsOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("IsOn should be true when button is on")
	}

	in.Update(1, &InPoll{}, zeroCam)
	if in.IsOn(ButtonA) {
		t.Error("IsOn should be false when button is off")
	}

	in.Update(10, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("IsOn should be true when button is on again")
	}
}

func TestIsOnMultiBit(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA | KeyB}}, zeroCam)
	if !in.IsOn(ButtonA | ButtonB) {
		t.Error("IsOn with multi-bit should require ALL bits")
	}
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOn(ButtonA | ButtonB) {
		t.Error("IsOn should be false when not all bits active")
	}
}

func TestIsOnStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should be false while button is off")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should be true when button turns on")
	}

	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should not repeat while button remains on")
	}
}

func TestIsOnEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should be false while button is on")
	}

	in.Update(1, &InPoll{}, zeroCam)
	if !in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should be true when button turns off")
	}

	in.Update(2, &InPoll{}, zeroCam)
	if in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should not repeat while button remains off")
	}
}

func TestIsAnyOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InPoll{}, zeroCam)
	if in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be false when all buttons are off")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be true when any button is on")
	}

	in.Update(2, &InPoll{}, zeroCam)
	if in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be false when all buttons are off again")
	}
}

func TestIsAnyOnStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InPoll{}, zeroCam)
	if in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should be false while all buttons are off")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should be true when any button turns on")
	}

	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should not repeat while buttons remain on")
	}
}

func TestIsAnyOnEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA | KeyB}}, zeroCam)
	if in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should be false while all buttons are on")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyB}}, zeroCam)
	if !in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should be true when any button turns off")
	}

	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyB}}, zeroCam)
	if in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should not repeat while buttons remain unchanged")
	}
}

func TestIsAnyStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InPoll{}, zeroCam)
	if in.IsAnyStart(ButtonA | ButtonB) {
		t.Error("IsAnyStart should be false while all buttons are unchanged")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsAnyStart(ButtonA | ButtonB) {
		t.Error("IsAnyStart should be true when any button turns on")
	}

	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsAnyStart(ButtonA | ButtonB) {
		t.Error("IsAnyStart should not repeat while buttons remain unchanged")
	}

	in.Update(3, &InPoll{}, zeroCam)
	if !in.IsAnyStart(ButtonA | ButtonB) {
		t.Error("IsAnyStart should be true when any button turns off")
	}
}

func TestButtonQueriesPure(t *testing.T) {
	in := NewIn()
	queries := []struct {
		name  string
		query func(Button) bool
	}{
		{"IsOff", in.IsOff},
		{"IsOffStart", in.IsOffStart},
		{"IsOffEnd", in.IsOffEnd},
		{"IsOn", in.IsOn},
		{"IsOnStart", in.IsOnStart},
		{"IsOnEnd", in.IsOnEnd},
		{"IsAnyOn", in.IsAnyOn},
		{"IsAnyOnStart", in.IsAnyOnStart},
		{"IsAnyOnEnd", in.IsAnyOnEnd},
		{"IsAnyStart", in.IsAnyStart},
	}
	states := []Button{0, ButtonA, ButtonB, ButtonA | ButtonB}
	for _, on := range states {
		for _, prevOn := range states {
			in.On, in.PrevOn = on, prevOn
			for _, query := range queries {
				for _, mask := range states {
					in.Mask = mask
					want := query.query(ButtonA | ButtonB)
					if mask == ButtonA|ButtonB && want {
						t.Errorf("%s matched fully masked buttons", query.name)
					}
					for range 2 {
						if got := query.query(ButtonA | ButtonB); got != want {
							t.Errorf("%s changed result on repeated calls", query.name)
						}
						if in.On != on || in.PrevOn != prevOn || in.Mask != mask {
							t.Fatalf("%s changed input state", query.name)
						}
					}
				}
			}
		}
	}
}

func TestAnyQueriesUseUnmaskedButtons(t *testing.T) {
	in := NewIn()
	in.On = ButtonA | ButtonB
	in.PrevOn = ButtonA
	in.Mask = ButtonA
	btns := ButtonA | ButtonB
	if !in.IsAnyOn(btns) || !in.IsAnyOnStart(btns) || !in.IsAnyStart(btns) {
		t.Error("masking A hid B's press")
	}
	if in.IsOn(btns) || in.IsOnStart(btns) {
		t.Error("an all-button query matched a partially masked chord")
	}
	in.On, in.PrevOn = ButtonA, ButtonA|ButtonB
	if !in.IsAnyOnEnd(btns) || !in.IsAnyStart(btns) {
		t.Error("masking A hid B's release")
	}
	if in.IsAnyOn(btns) || in.IsAnyOnStart(btns) {
		t.Error("an any-button query matched masked A")
	}
	if in.IsOff(btns) || in.IsOffStart(btns) || in.IsOnEnd(btns) {
		t.Error("an all-button query matched a partially masked chord")
	}
}

func TestButtonChordEdges(t *testing.T) {
	tests := []struct {
		name       string
		on, prevOn Button
		// OnStart, OffStart, OnEnd, AnyOnStart, AnyOnEnd.
		want [5]bool
	}{
		{"complete", ButtonA | ButtonB, ButtonA,
			[5]bool{true, false, false, true, false}},
		{"break", ButtonA, ButtonA | ButtonB,
			[5]bool{false, false, true, false, true}},
		{"finish release", 0, ButtonA,
			[5]bool{false, true, false, false, true}},
		{"swap", ButtonB, ButtonA,
			[5]bool{false, false, false, true, true}},
		{"hold", ButtonA | ButtonB, ButtonA | ButtonB,
			[5]bool{false, false, false, false, false}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			in := NewIn()
			in.On, in.PrevOn = test.on, test.prevOn
			btns := ButtonA | ButtonB
			got := [5]bool{
				in.IsOnStart(btns), in.IsOffStart(btns), in.IsOnEnd(btns),
				in.IsAnyOnStart(btns), in.IsAnyOnEnd(btns),
			}
			if got != test.want {
				t.Errorf("chord edges = %v, want %v", got, test.want)
			}
		})
	}
}

func TestMapKey(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapKey should map key to button")
	}
}

func TestMapClick(t *testing.T) {
	in := NewIn()
	in.MapClick(ClickPrimary, ButtonA)
	in.Update(0, &InPoll{
		PtrsLen: 1,
		Ptrs:    [MaxPtrs]PtrPoll{{Primary: true, Clicks: ClickPrimary}},
	}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapClick should map pointer click to button")
	}
}

func TestMapButton(t *testing.T) {
	in := NewIn()
	in.MapButton(GamepadButtonA, ButtonA)
	in.Update(0, &InPoll{
		PadsLen: 1,
		Pads:    [4]GamepadPoll{{Connected: true, Buttons: GamepadButtonA}},
	}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapButton should map gamepad button to button")
	}
}

func TestMapAxis(t *testing.T) {
	in := NewIn()
	in.MapAxis(0, ButtonL, ButtonR)
	in.Update(0, &InPoll{
		PadsLen: 1,
		Pads:    [4]GamepadPoll{{Connected: true, Axes: [4]float32{-0.6, 0, 0, 0}}},
	}, zeroCam)
	if !in.IsOn(ButtonL) {
		t.Error("MapAxis should map negative axis to button")
	}

	in.Update(1, &InPoll{
		PadsLen: 1,
		Pads:    [4]GamepadPoll{{Connected: true, Axes: [4]float32{0.6, 0, 0, 0}}},
	}, zeroCam)
	if !in.IsOn(ButtonR) {
		t.Error("MapAxis should map positive axis to button")
	}
}

func TestMapWheel(t *testing.T) {
	in := NewIn()
	in.MapWheel(ButtonU, ButtonD)
	in.Update(
		0,
		&InPoll{
			Wheel: WheelPoll{Delta: vgeo.XYZ[float32]{XY: vgeo.XY[float32]{Y: -1}}},
		},
		zeroCam,
	)
	if !in.IsOn(ButtonU) {
		t.Error("MapWheel should map negative wheel delta to button")
	}

	in.Update(
		1,
		&InPoll{
			Wheel: WheelPoll{Delta: vgeo.XYZ[float32]{XY: vgeo.XY[float32]{Y: 1}}},
		},
		zeroCam,
	)
	if !in.IsOn(ButtonD) {
		t.Error("MapWheel should map positive wheel delta to button")
	}
}

func TestMapText(t *testing.T) {
	in := NewIn()
	in.MapText('z', ButtonA)
	poll := &InPoll{}
	poll.Kbd.Text[0] = 'z'
	poll.Kbd.TextLen = 1
	in.Update(0, poll, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapText should map text rune to button")
	}
}

func TestMapDefaultText(t *testing.T) {
	tests := []struct {
		text string
		want Button
	}{
		{text: "0", want: ButtonScaleReset},
		{text: "-", want: ButtonScaleDec},
		{text: "+", want: ButtonScaleInc},
	}
	for _, test := range tests {
		t.Run(test.text, func(t *testing.T) {
			in := NewIn()
			in.MapDefaultText()
			poll := &InPoll{}
			copy(poll.Kbd.Text[:], test.text)
			poll.Kbd.TextLen = uint16(len(test.text))
			in.Update(0, poll, zeroCam)
			if !in.IsOn(test.want) {
				t.Errorf("text %q did not map to %v", test.text, test.want)
			}
		})
	}
}

func TestQueriesDoNotCreateRelease(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	for now := range 2 {
		in.Update(float64(now), &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
		for _, mask := range []Button{0, ButtonA} {
			in.Mask = mask
			if got := in.IsOn(ButtonA); got != (mask == 0) {
				t.Errorf("Mask=%v: IsOn = %v, want %v", mask, got, mask == 0)
			}
			if in.IsOff(ButtonA) || in.IsOffStart(ButtonA) ||
				in.IsOnEnd(ButtonA) || in.IsAnyOnEnd(ButtonA) {
				t.Error("reading or masking a held button reported a release")
			}
			if in.On != ButtonA {
				t.Error("query changed the held button's state")
			}
		}
	}
}

func TestMaskResetsOnUpdate(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	in.Mask |= ButtonA | ButtonB
	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.Mask != 0 {
		t.Errorf("Mask = %v, want 0 after Update", in.Mask)
	}
	if !in.IsOn(ButtonA) {
		t.Error("button should remain on")
	}
	if in.IsOnStart(ButtonA) || in.IsOffStart(ButtonA) {
		t.Error("resetting Mask changed button edges")
	}
}

func TestOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if in.On != 0 {
		t.Errorf("On = %v, want 0", in.On)
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.On != ButtonA {
		t.Errorf("On = %v, want %v", in.On, ButtonA)
	}

	in.Update(2, &InPoll{}, zeroCam)
	if in.On != 0 {
		t.Errorf("On = %v, want 0", in.On)
	}
}

func TestEverOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if in.EverOn {
		t.Error("EverOn should be false before any button is on")
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.EverOn {
		t.Error("EverOn should be true after a button turns on")
	}

	in.Update(2, &InPoll{}, zeroCam)
	if !in.EverOn {
		t.Error("EverOn should stay true after button turns off")
	}
}

func TestPrevOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InPoll{}, zeroCam)
	if in.PrevOn != 0 {
		t.Errorf("PrevOn = %v, want 0", in.PrevOn)
	}

	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.PrevOn != 0 {
		t.Errorf("PrevOn = %v, want 0", in.PrevOn)
	}

	in.Update(2, &InPoll{}, zeroCam)
	if in.PrevOn != ButtonA {
		t.Errorf("PrevOn = %v, want %v", in.PrevOn, ButtonA)
	}
}

func TestDir(t *testing.T) {
	in := NewIn()
	in.MapDefaultKeyboard()
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyRight}}, zeroCam)
	if in.Dir.X != 1 || in.Dir.Y != 0 {
		t.Errorf("expected Dir (1,0), got (%d,%d)", in.Dir.X, in.Dir.Y)
	}
	if !in.DirOn {
		t.Error("DirOn = false, want true")
	}
	if !in.DirOnStart() {
		t.Error("DirOnStart() = false, want true")
	}
	in.Update(1, &InPoll{Kbd: KeyboardPoll{Keys: KeyRight}}, zeroCam)
	if in.PrevDir != vgeo.NewXY[int8](1, 0) {
		t.Errorf("PrevDir = %v, want (1,0)", in.PrevDir)
	}
	if in.DirOnStart() {
		t.Error("DirOnStart() = true, want false")
	}
	in.Update(2, &InPoll{Kbd: KeyboardPoll{Keys: KeyRight | KeyDown}}, zeroCam)
	if in.PrevDir != vgeo.NewXY[int8](1, 0) {
		t.Errorf("PrevDir = %v, want (1,0)", in.PrevDir)
	}
	if !in.DirOnStart() {
		t.Error("DirOnStart() = false, want true")
	}
	in.Update(3, &InPoll{}, zeroCam)
	if in.DirOn {
		t.Error("DirOn = true, want false")
	}
}

func TestKbd(t *testing.T) {
	in := NewIn()
	in.Update(0, &InPoll{Kbd: KeyboardPoll{Keys: KeyUp | KeyA}}, zeroCam)
	if in.Kbd.Keys != KeyUp|KeyA {
		t.Errorf("Keys field mismatch: got %v", in.Kbd.Keys)
	}
}

func TestPtr(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 1,
		Ptrs:    [MaxPtrs]PtrPoll{{Primary: true, Clicks: ClickPrimary}},
	}
	poll.Ptrs[0].Phy = vgeo.NewBox[float32](2, 4, 12, 24)
	in.Update(0, poll, vgeo.NewBox[float32](100, 200, 0, 0))
	if in.Ptr == nil {
		t.Error("Ptr should not be nil")
	}
	if in.Ptr.Clicks() != ClickPrimary {
		t.Error("Buttons field mismatch")
	}
	if *in.Ptr.Phy() != vgeo.NewBox[float32](2, 4, 12, 24) {
		t.Errorf("Phy mismatch: got %v", *in.Ptr.Phy())
	}
	if *in.Ptr.CenterPhy() != vgeo.NewXY[float32](7, 14) {
		t.Errorf("CenterPhy mismatch: got %v", *in.Ptr.CenterPhy())
	}
	if !in.Ptr.Moved {
		t.Error("initial Ptr.Moved = false, want true")
	}
	in.Update(1, poll, vgeo.NewBox[float32](100, 200, 0, 0))
	if in.Ptr.Moved {
		t.Error("stationary Ptr.Moved = true, want false")
	}
	poll.Ptrs[0].Phy.Min.X++
	in.Update(2, poll, vgeo.NewBox[float32](100, 200, 0, 0))
	if !in.Ptr.Moved {
		t.Error("moved Ptr.Moved = false, want true")
	}
}

func TestPtrSelectsPrimary(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 2,
		Ptrs: [MaxPtrs]PtrPoll{
			{ID: 2, Clicks: ClickPrimary},
			{ID: 7, Primary: true, Clicks: ClickPrimary},
		},
	}
	in.Update(0, poll, zeroCam)
	if in.Ptr == nil || in.Ptr.ID() != 7 {
		t.Fatalf("Ptr = %#v, want primary pointer ID 7", in.Ptr)
	}
	if len(in.Ptrs) != 2 {
		t.Fatalf("Ptrs length = %d, want 2", len(in.Ptrs))
	}
	poll.Ptrs[1].Primary = false
	in.Update(1, poll, zeroCam)
	if in.Ptr != nil {
		t.Fatalf("Ptr = %#v without a primary pointer, want nil", in.Ptr)
	}
}

func TestWheel(t *testing.T) {
	in := NewIn()
	in.Update(
		0,
		&InPoll{
			Wheel: WheelPoll{Delta: vgeo.XYZ[float32]{XY: vgeo.XY[float32]{Y: 3.5}}},
		},
		zeroCam,
	)
	if in.Wheel.Delta.Y != 3.5 {
		t.Errorf("Wheel.Delta.Y mismatch: got %v", in.Wheel.Delta.Y)
	}
}

func TestPinch(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 3,
		Ptrs: [MaxPtrs]PtrPoll{
			{ID: 1, Primary: true, Clicks: ClickPrimary},
			{ID: 2, Clicks: ClickPrimary},
			{ID: 3, Clicks: ClickPrimary},
		},
	}
	poll.Ptrs[0].Phy = vgeo.NewBox[float32](0, 0, 0, 0)
	poll.Ptrs[1].Phy = vgeo.NewBox[float32](10, 0, 10, 0)
	poll.Ptrs[2].Phy = vgeo.NewBox[float32](0, 0, 0, 0)
	in.Update(0, poll, zeroCam)
	if in.Pinch == nil ||
		in.Pinch.SpanPhy != vgeo.NewXY[float32](10, 0) ||
		!xyNear(in.Pinch.CenterPhy, vgeo.NewXY[float32](10.0/3.0, 0)) ||
		in.Pinch.DeltaPhy != (vgeo.XY[float32]{}) ||
		in.Pinch.DeltaCenterPhy != (vgeo.XY[float32]{}) {
		t.Errorf("initial pinch = %#v, want span (10, 0), center (10/3, 0), and zero deltas", in.Pinch)
	}

	poll.Ptrs[1].Phy = vgeo.NewBox[float32](14, 0, 14, 0)
	in.Update(1, poll, zeroCam)
	if in.Pinch == nil ||
		in.Pinch.SpanPhy != vgeo.NewXY[float32](14, 0) ||
		!xyNear(in.Pinch.CenterPhy, vgeo.NewXY[float32](14.0/3.0, 0)) ||
		in.Pinch.DeltaPhy != vgeo.NewXY[float32](4, 0) ||
		!xyNear(in.Pinch.DeltaCenterPhy, vgeo.NewXY[float32](4.0/3.0, 0)) {
		t.Errorf("moved pinch = %#v, want span (14, 0), center (14/3, 0), and deltas (4, 0), (4/3, 0)", in.Pinch)
	}

	in.Update(2, poll, zeroCam)
	if in.Pinch == nil ||
		in.Pinch.SpanPhy != vgeo.NewXY[float32](14, 0) ||
		!xyNear(in.Pinch.CenterPhy, vgeo.NewXY[float32](14.0/3.0, 0)) ||
		in.Pinch.DeltaPhy != (vgeo.XY[float32]{}) ||
		in.Pinch.DeltaCenterPhy != (vgeo.XY[float32]{}) {
		t.Errorf("stationary pinch = %#v, want span (14, 0), center (14/3, 0), and zero deltas", in.Pinch)
	}

	poll.PtrsLen = 1
	in.Update(3, poll, zeroCam)
	if in.Pinch != nil {
		t.Errorf("Pinch = %#v, want nil", in.Pinch)
	}
}

func TestDrag(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 2,
		Ptrs: [MaxPtrs]PtrPoll{
			{ID: 1, Primary: true, Clicks: ClickPrimary},
			{ID: 2, Clicks: ClickPrimary},
		},
	}
	poll.Ptrs[0].Phy = vgeo.NewBox[float32](0, 0, 0, 0)
	poll.Ptrs[1].Phy = vgeo.NewBox[float32](10, 0, 10, 0)
	in.Update(0, poll, zeroCam)
	if in.Ptrs[0].Drag != (Drag{StartPhy: vgeo.NewXY[float32](0, 0)}) ||
		in.Ptrs[1].Drag != (Drag{StartPhy: vgeo.NewXY[float32](10, 0)}) {
		t.Errorf(
			"initial drags = %#v, %#v, want start points",
			in.Ptrs[0].Drag,
			in.Ptrs[1].Drag,
		)
	}

	poll.Ptrs[0].Phy = vgeo.NewBox[float32](5, 0, 5, 0)
	poll.Ptrs[1].Phy = vgeo.NewBox[float32](15, 0, 15, 0)
	in.Update(1, poll, zeroCam)
	for i := range in.Ptrs {
		drag := in.Ptrs[i].Drag
		startPhy := vgeo.NewXY[float32](float32(i*10), 0)
		if drag.StartPhy != startPhy ||
			drag.DeltaPhy != vgeo.NewXY[float32](5, 0) ||
			!drag.On || !drag.Start || drag.End {
			t.Errorf("pointer %d Drag = %#v, want start", i, drag)
		}
	}

	poll.Ptrs[0].Phy = vgeo.NewBox[float32](7, 0, 7, 0)
	poll.Ptrs[1].Phy = vgeo.NewBox[float32](17, 0, 17, 0)
	in.Update(2, poll, zeroCam)
	for i := range in.Ptrs {
		drag := in.Ptrs[i].Drag
		if drag.DeltaPhy != vgeo.NewXY[float32](2, 0) ||
			!drag.On || drag.Start || drag.End {
			t.Errorf("pointer %d Drag = %#v, want on with delta (2, 0)", i, drag)
		}
	}

	poll.Ptrs[0].Clicks = 0
	in.Update(3, poll, zeroCam)
	if in.Ptrs[0].Drag != (Drag{
		StartPhy: vgeo.NewXY[float32](0, 0), End: true,
	}) {
		t.Errorf(
			"released pointer Drag = %#v, want end",
			in.Ptrs[0].Drag,
		)
	}
	if in.Ptrs[1].Drag != (Drag{
		StartPhy: vgeo.NewXY[float32](10, 0), On: true,
	}) {
		t.Errorf(
			"held pointer Drag = %#v, want on",
			in.Ptrs[1].Drag,
		)
	}
}

func TestDragContactCenter(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 1,
		Ptrs:    [MaxPtrs]PtrPoll{{ID: 1, Primary: true}},
	}
	start := vgeo.NewXY[float32](100.25, 100.5)
	for i, test := range []struct {
		name   string
		center vgeo.XY[float32]
		size   vgeo.WH[float32]
		clicks Click
		want   Drag
	}{
		{
			"press", start, vgeo.NewWH[float32](10, 8), ClickPrimary,
			Drag{StartPhy: start},
		},
		{
			"resize", start, vgeo.NewWH[float32](22, 20), ClickPrimary,
			Drag{StartPhy: start},
		},
		{
			"move", vgeo.NewXY[float32](106.5, 100.5),
			vgeo.NewWH[float32](30, 24), ClickPrimary,
			Drag{
				StartPhy: start, DeltaPhy: vgeo.NewXY[float32](6.25, 0),
				On: true, Start: true,
			},
		},
		{
			"resize while dragging", vgeo.NewXY[float32](106.5, 100.5),
			vgeo.NewWH[float32](4, 40), ClickPrimary,
			Drag{StartPhy: start, On: true},
		},
		{
			"release", vgeo.NewXY[float32](106.5, 100.5),
			vgeo.NewWH[float32](1, 1), 0,
			Drag{StartPhy: start, End: true},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			poll.Ptrs[0].Phy = vgeo.XYWH(
				test.center.X-test.size.W/2, test.center.Y-test.size.H/2,
				test.size.W, test.size.H,
			)
			poll.Ptrs[0].Clicks = test.clicks
			in.Update(float64(i), poll, zeroCam)
			if got := in.Ptr.Drag; got != test.want {
				t.Errorf("Drag = %#v, want %#v", got, test.want)
			}
		})
	}
}

func TestPinchContactCenters(t *testing.T) {
	in := NewIn()
	poll := &InPoll{
		PtrsLen: 2,
		Ptrs: [MaxPtrs]PtrPoll{
			{ID: 1, Primary: true, Clicks: ClickPrimary},
			{ID: 2, Clicks: ClickPrimary},
		},
	}
	for i, test := range []struct {
		name        string
		firstW      float32
		secondH     float32
		second      vgeo.XY[float32]
		span, delta vgeo.XY[float32]
		center      vgeo.XY[float32]
		centerDelta vgeo.XY[float32]
	}{
		{
			"press",
			10,
			8,
			vgeo.NewXY[float32](200.75, 140.25),
			vgeo.NewXY[float32](100.5, 39.75),
			vgeo.XY[float32]{},
			vgeo.NewXY[float32](150.5, 120.375),
			vgeo.XY[float32]{},
		},
		{
			"resize",
			22,
			20,
			vgeo.NewXY[float32](200.75, 140.25),
			vgeo.NewXY[float32](100.5, 39.75),
			vgeo.XY[float32]{},
			vgeo.NewXY[float32](150.5, 120.375),
			vgeo.XY[float32]{},
		},
		{
			"move and resize",
			30,
			24,
			vgeo.NewXY[float32](204.75, 146.25),
			vgeo.NewXY[float32](104.5, 45.75),
			vgeo.NewXY[float32](4, 6),
			vgeo.NewXY[float32](152.5, 123.375),
			vgeo.NewXY[float32](2, 3),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			poll.Ptrs[0].Phy = vgeo.XYWH(
				100.25-test.firstW/2, float32(96.5), test.firstW, float32(8),
			)
			poll.Ptrs[1].Phy = vgeo.XYWH(
				test.second.X-5, test.second.Y-test.secondH/2,
				float32(10), test.secondH,
			)
			in.Update(float64(i), poll, zeroCam)
			pinch := in.Pinch
			if pinch == nil {
				t.Fatal("Pinch = nil, want active pinch")
			}
			if pinch.SpanPhy != test.span || pinch.DeltaPhy != test.delta ||
				pinch.CenterPhy != test.center ||
				pinch.DeltaCenterPhy != test.centerDelta {
				t.Errorf("Pinch = %#v, want %#v", pinch, test)
			}
		})
	}
}
