package vinput

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
)

var zeroCam = vgeo.Box[float32]{}

func TestIsHeld(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)

	in.Update(10, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)

	in.Update(309, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsHeld() {
		t.Error("held should be false before MinHeldMillis")
	}

	in.Update(310, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis")
	}

	in.Update(1000, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should remain true after MinHeldMillis")
	}

	in.Update(1001, &InputPoll{}, zeroCam)
	if in.IsHeld() {
		t.Error("held should reset when off")
	}

	in.Update(1002, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsHeld() {
		t.Error("held should remain off before MinHeldMillis")
	}

	in.Update(1302, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis again")
	}

	in.Update(1303, &InputPoll{}, zeroCam)
	if in.IsHeld() {
		t.Error("held should reset when off")
	}

	in.Update(1603, &InputPoll{}, zeroCam)
	if !in.IsHeld() {
		t.Error("held should be true after MinHeldMillis of unchanging input")
	}
}

func TestIsOff(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if !in.IsOff(ButtonA) {
		t.Error("IsOff should be true when button is off")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOff(ButtonA) {
		t.Error("IsOff should be false when button is on")
	}

	in.Update(10, &InputPoll{}, zeroCam)
	if !in.IsOff(ButtonA) {
		t.Error("IsOff should be true when button is off again")
	}
}

func TestIsOffStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should be false while button is on")
	}

	in.Update(1, &InputPoll{}, zeroCam)
	if !in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should be true when button turns off")
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if in.IsOffStart(ButtonA) {
		t.Error("IsOffStart should not repeat while button remains off")
	}
}

func TestIsOffEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should be false while button is off")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should be true when button turns on")
	}

	in.Update(2, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOffEnd(ButtonA) {
		t.Error("IsOffEnd should not repeat while button remains on")
	}
}

func TestIsOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("IsOn should be true when button is on")
	}

	in.Update(1, &InputPoll{}, zeroCam)
	if in.IsOn(ButtonA) {
		t.Error("IsOn should be false when button is off")
	}

	in.Update(10, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("IsOn should be true when button is on again")
	}
}

func TestIsOnMultiBit(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA | KeyB}}, zeroCam)
	if !in.IsOn(ButtonA | ButtonB) {
		t.Error("IsOn with multi-bit should require ALL bits")
	}
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOn(ButtonA | ButtonB) {
		t.Error("IsOn should be false when not all bits active")
	}
}

func TestIsOnStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should be false while button is off")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should be true when button turns on")
	}

	in.Update(2, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOnStart(ButtonA) {
		t.Error("IsOnStart should not repeat while button remains on")
	}
}

func TestIsOnEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should be false while button is on")
	}

	in.Update(1, &InputPoll{}, zeroCam)
	if !in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should be true when button turns off")
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if in.IsOnEnd(ButtonA) {
		t.Error("IsOnEnd should not repeat while button remains off")
	}
}

func TestIsAnyOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be false when all buttons are off")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be true when any button is on")
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if in.IsAnyOn(ButtonA | ButtonB) {
		t.Error("IsAnyOn should be false when all buttons are off again")
	}
}

func TestIsAnyOnStart(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should be false while all buttons are off")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should be true when any button turns on")
	}

	in.Update(2, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.IsAnyOnStart(ButtonA | ButtonB) {
		t.Error("IsAnyOnStart should not repeat while buttons remain on")
	}
}

func TestIsAnyOnEnd(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.MapKey(KeyB, ButtonB)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA | KeyB}}, zeroCam)
	if in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should be false while all buttons are on")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyB}}, zeroCam)
	if !in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should be true when any button turns off")
	}

	in.Update(2, &InputPoll{Kbd: KeyboardPoll{Keys: KeyB}}, zeroCam)
	if in.IsAnyOnEnd(ButtonA | ButtonB) {
		t.Error("IsAnyOnEnd should not repeat while buttons remain unchanged")
	}
}

func TestMapKey(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapKey should map key to button")
	}
}

func TestMapClick(t *testing.T) {
	in := NewIn()
	in.MapClick(ClickPrimary, ButtonA)
	in.Update(0, &InputPoll{
		PtrsLen: 1,
		Ptrs:    [MaxPointers]PointerPoll{{Primary: true, Clicks: ClickPrimary}},
	}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapClick should map pointer click to button")
	}
}

func TestMapButton(t *testing.T) {
	in := NewIn()
	in.MapButton(GamepadButtonA, ButtonA)
	in.Update(0, &InputPoll{
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
	in.Update(0, &InputPoll{
		PadsLen: 1,
		Pads:    [4]GamepadPoll{{Connected: true, Axes: [4]float32{-0.6, 0, 0, 0}}},
	}, zeroCam)
	if !in.IsOn(ButtonL) {
		t.Error("MapAxis should map negative axis to button")
	}

	in.Update(1, &InputPoll{
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
		&InputPoll{
			Wheel: WheelPoll{Delta: vgeo.XYZ[float32]{XY: vgeo.XY[float32]{Y: -1}}},
		},
		zeroCam,
	)
	if !in.IsOn(ButtonU) {
		t.Error("MapWheel should map negative wheel delta to button")
	}

	in.Update(
		1,
		&InputPoll{
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
	poll := &InputPoll{}
	poll.Kbd.Text[0] = 'z'
	poll.Kbd.TextLen = 1
	in.Update(0, poll, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("MapText should map text rune to button")
	}
}

func TestMaskBlocksOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("Initial button should be on")
	}
	if in.IsOn(ButtonA) {
		t.Error("Mask button should return false for IsOn")
	}
	if in.IsOnStart(ButtonA) {
		t.Error("Mask button should return false for IsOnStart")
	}
}

func TestMaskResetsOnUpdate(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("Initial button should be on")
	}
	if in.IsOn(ButtonA) {
		t.Error("Mask button should return false for IsOn")
	}
	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.IsOn(ButtonA) {
		t.Error("Mask should be reset by Update")
	}
}

func TestOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.On != 0 {
		t.Errorf("On = %v, want 0", in.On)
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.On != ButtonA {
		t.Errorf("On = %v, want %v", in.On, ButtonA)
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if in.On != 0 {
		t.Errorf("On = %v, want 0", in.On)
	}
}

func TestEverOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.EverOn {
		t.Error("EverOn should be false before any button is on")
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if !in.EverOn {
		t.Error("EverOn should be true after a button turns on")
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if !in.EverOn {
		t.Error("EverOn should stay true after button turns off")
	}
}

func TestPrevOn(t *testing.T) {
	in := NewIn()
	in.MapKey(KeyA, ButtonA)
	in.Update(0, &InputPoll{}, zeroCam)
	if in.PrevOn != 0 {
		t.Errorf("PrevOn = %v, want 0", in.PrevOn)
	}

	in.Update(1, &InputPoll{Kbd: KeyboardPoll{Keys: KeyA}}, zeroCam)
	if in.PrevOn != 0 {
		t.Errorf("PrevOn = %v, want 0", in.PrevOn)
	}

	in.Update(2, &InputPoll{}, zeroCam)
	if in.PrevOn != ButtonA {
		t.Errorf("PrevOn = %v, want %v", in.PrevOn, ButtonA)
	}
}

func TestDir(t *testing.T) {
	in := NewIn()
	in.MapDefaultKeyboard()
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyRight | KeyDown}}, zeroCam)
	if in.Dir.X != 1 || in.Dir.Y != 1 {
		t.Errorf("expected Dir (1,1), got (%d,%d)", in.Dir.X, in.Dir.Y)
	}
}

func TestKbd(t *testing.T) {
	in := NewIn()
	in.Update(0, &InputPoll{Kbd: KeyboardPoll{Keys: KeyUp | KeyA}}, zeroCam)
	if in.Kbd.Keys != KeyUp|KeyA {
		t.Errorf("Keys field mismatch: got %v", in.Kbd.Keys)
	}
}

func TestPtr(t *testing.T) {
	in := NewIn()
	poll := &InputPoll{
		PtrsLen: 1,
		Ptrs:    [MaxPointers]PointerPoll{{Primary: true, Clicks: ClickPrimary}},
	}
	poll.Ptrs[0].Phy = vgeo.NewBox[float32](2, 4, 12, 24)
	in.Update(0, poll, vgeo.NewBox[float32](100, 200, 0, 0))
	if in.Ptr == nil {
		t.Error("Pointer should not be nil")
	}
	if in.Ptr.Clicks() != ClickPrimary {
		t.Error("Buttons field mismatch")
	}
	if *in.Ptr.Phy() != vgeo.NewBox[float32](2, 4, 12, 24) {
		t.Errorf("Phy mismatch: got %v", *in.Ptr.Phy())
	}
	if *in.Ptr.XY() != vgeo.NewXY[float32](102, 204) {
		t.Errorf("XY mismatch: got %v", *in.Ptr.XY())
	}
	if *in.Ptr.Center() != vgeo.NewXY[float32](107, 214) {
		t.Errorf("Center mismatch: got %v", *in.Ptr.Center())
	}
	if *in.Ptr.CenterPhy() != vgeo.NewXY[float32](7, 14) {
		t.Errorf("CenterPhy mismatch: got %v", *in.Ptr.CenterPhy())
	}
}

func TestWheel(t *testing.T) {
	in := NewIn()
	in.Update(
		0,
		&InputPoll{
			Wheel: WheelPoll{Delta: vgeo.XYZ[float32]{XY: vgeo.XY[float32]{Y: 3.5}}},
		},
		zeroCam,
	)
	if in.Wheel.Delta.Y != 3.5 {
		t.Errorf("Wheel.Delta.Y mismatch: got %v", in.Wheel.Delta.Y)
	}
}
