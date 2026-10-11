package veng

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

// previews a focused toggle's next state while its primary button is held.
func TestButtonEnt_TogglePalPreview(t *testing.T) {
	pals := ButtonPals{Base: 1, Focused: 2, On: 3, FocusedOn: 4}
	tests := []struct {
		name    string
		on      bool
		focused bool
		pressed bool
		want    vatlas.Tag
	}{
		{"off", false, false, false, pals.Base},
		{"off focused", false, true, false, pals.Focused},
		{"off held", false, true, true, pals.FocusedOn},
		{"off held away", false, false, false, pals.Base},
		{"on", true, false, false, pals.On},
		{"on held", true, true, true, pals.Focused},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := ButtonEnt{Type: ButtonTypeToggle, On: test.on, Focused: test.focused}
			if got := ent.pal(pals, test.pressed); got != test.want {
				t.Errorf("pal() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestButtonEnt_FocusesCursorHitbox(t *testing.T) {
	for _, test := range []struct {
		name      string
		cursorPhy vgeo.Box[float32]
		focused   bool
	}{
		{"intersects", vgeo.XYWH[float32](8, 12, 3, 3), true},
		{"misses", vgeo.XYWH[float32](0, 0, 3, 3), false},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := ButtonEnt{}
			ent.XY = vgeo.NewXY[float32](10, 10)
			ent.WH = vgeo.NewWH[uint16](10, 10)
			eng := newButtonTestEng(test.cursorPhy)
			ent.Update(eng)
			if ent.Focused != test.focused {
				t.Errorf("Focused = %v, want %v", ent.Focused, test.focused)
			}
		})
	}
}

// keeps updating while a focused button is held for per-frame callbacks.
func TestButtonEnt_PressedLoops(t *testing.T) {
	ent := ButtonEnt{}
	ent.XY = vgeo.NewXY[float32](10, 10)
	ent.WH = vgeo.NewWH[uint16](10, 10)
	cursorPhy := vgeo.XYWH[float32](12, 12, 1, 1)
	eng := newButtonTestEng(cursorPhy)
	in := eng.In()
	in.On = vin.ButtonA
	ent.Update(eng)
	in.PrevOn = in.On
	in.Mask = 0
	if got := ent.Update(eng); got != Loop {
		t.Errorf("held update = %v, want Loop", got)
	}
}

// toggles once when a focused primary-button hold becomes off.
func TestButtonEnt_ToggleClicksOnOffStart(t *testing.T) {
	ent := ButtonEnt{Type: ButtonTypeToggle}
	ent.XY = vgeo.NewXY[float32](10, 10)
	ent.WH = vgeo.NewWH[uint16](10, 10)
	clicks := 0
	ent.OnClick = func(*ButtonEnt) { clicks++ }
	cursorPhy := vgeo.XYWH[float32](12, 12, 1, 1)
	eng := newButtonTestEng(cursorPhy)
	in := eng.In()

	in.On = vin.ButtonA
	ent.Update(eng)
	in.PrevOn = in.On
	in.Mask = 0
	ent.Update(eng)
	if clicks != 0 {
		t.Errorf("held clicks = %d, want 0", clicks)
	}
	in.On = 0
	in.Mask = 0
	ent.Update(eng)
	if clicks != 1 {
		t.Errorf("release clicks = %d, want 1", clicks)
	}
	in.PrevOn = in.On
	in.Mask = 0
	ent.Update(eng)
	if clicks != 1 {
		t.Errorf("off clicks = %d, want 1", clicks)
	}
}

func TestButtonEnt_MasksPrimary(t *testing.T) {
	for _, test := range []struct {
		name string
		typ  ButtonType
	}{
		{"button", ButtonTypeButton},
		{"toggle", ButtonTypeToggle},
	} {
		t.Run(test.name, func(t *testing.T) {
			eng := newButtonTestEng(vgeo.XYWH[float32](12, 12, 1, 1))
			in := eng.In()
			in.MapKey(vin.KeyA, vin.ButtonA)
			ents := [2]ButtonEnt{{Type: test.typ}, {Type: test.typ}}
			clicks := [2]int{}
			for i := range ents {
				ents[i].XY = vgeo.NewXY[float32](10, 10)
				ents[i].WH = vgeo.NewWH[uint16](10, 10)
				ents[i].OnClick = func(*ButtonEnt) {
					if in.Mask&vin.ButtonA == 0 {
						t.Error("callback ran before claiming ButtonA")
					}
					clicks[i]++
				}
			}
			for now, keys := range []vin.Key{vin.KeyA, vin.KeyA, 0, 0} {
				in.Update(float64(now), &vin.InPoll{
					Kbd: vin.KeyboardPoll{Keys: keys},
				}, vgeo.Box[float32]{})
				for i := range ents {
					ents[i].Update(eng)
				}
				wantMask := vin.ButtonA
				if now == 3 {
					wantMask = 0
				}
				if in.Mask != wantMask {
					t.Errorf("update %d: Mask = %v, want %v", now, in.Mask, wantMask)
				}
				if ents[1].On || ents[1].Start {
					t.Errorf("update %d: second button acted on claimed input", now)
				}
			}
			if clicks != [2]int{1, 0} {
				t.Errorf("clicks = %v, want [1 0]", clicks)
			}
		})
	}
}

func TestButtonEnt_MaskedInput(t *testing.T) {
	for _, typ := range []ButtonType{ButtonTypeButton, ButtonTypeToggle} {
		for _, test := range []struct {
			name string
			on   bool
			held bool
		}{
			{"press", false, true},
			{"hold", true, true},
			{"release", true, false},
		} {
			t.Run(test.name, func(t *testing.T) {
				eng := newButtonTestEng(vgeo.XYWH[float32](12, 12, 1, 1))
				ent := ButtonEnt{Type: typ, On: test.on}
				ent.XY = vgeo.NewXY[float32](10, 10)
				ent.WH = vgeo.NewWH[uint16](10, 10)
				ent.OnClick = func(*ButtonEnt) { t.Error("masked input clicked") }
				in := eng.In()
				in.PrevOn = vin.ButtonA
				if test.held {
					in.On = vin.ButtonA
				}
				in.Mask = vin.ButtonA | vin.ButtonB
				stat := ent.Update(eng)
				if ent.Start || ent.Clicked() {
					t.Error("masked input reported a transition")
				}
				if typ == ButtonTypeButton && (ent.On || test.on && stat != Loop) {
					t.Error("masked input did not redraw the cancelled press")
				}
				if typ == ButtonTypeToggle && ent.On != test.on {
					t.Error("masked input changed toggle state")
				}
				if in.Mask != vin.ButtonA|vin.ButtonB {
					t.Errorf("Mask = %v, want ButtonA|ButtonB", in.Mask)
				}
			})
		}
	}
}

func newButtonTestEng(cursorPhy vgeo.Box[float32]) *Eng {
	eng := NewEng(&EngOpts{MaxSprs: 1})
	eng.Layer(0).Clip = vgeo.NewBox[float32](0, 0, 100, 100)
	eng.SetCursor(&CursorEnt{hitboxPhy: cursorPhy, hitboxPhyOn: true})
	return eng
}
