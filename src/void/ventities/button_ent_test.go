package ventities

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
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
			layer := vgfx.NewLayerConfig(0)
			layer.Clip = vgeo.NewBox[float32](0, 0, 100, 100)
			sprs := []vgfx.Spr{}
			ent.Update(vin.NewIn(), &sprs, &layer, nil, &test.cursorPhy)
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
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = vgeo.NewBox[float32](0, 0, 100, 100)
	in := vin.NewIn()
	in.On = vin.ButtonA
	sprs := []vgfx.Spr{}
	ent.Update(in, &sprs, &layer, nil, &cursorPhy)
	in.PrevOn = in.On
	in.Mask = 0
	if got := ent.Update(in, &sprs, &layer, nil, &cursorPhy); got != vgame.Loop {
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
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = vgeo.NewBox[float32](0, 0, 100, 100)
	in := vin.NewIn()
	sprs := []vgfx.Spr{}

	in.On = vin.ButtonA
	ent.Update(in, &sprs, &layer, nil, &cursorPhy)
	in.PrevOn = in.On
	in.Mask = 0
	ent.Update(in, &sprs, &layer, nil, &cursorPhy)
	if clicks != 0 {
		t.Errorf("held clicks = %d, want 0", clicks)
	}
	in.On = 0
	in.Mask = 0
	ent.Update(in, &sprs, &layer, nil, &cursorPhy)
	if clicks != 1 {
		t.Errorf("release clicks = %d, want 1", clicks)
	}
	in.PrevOn = in.On
	in.Mask = 0
	ent.Update(in, &sprs, &layer, nil, &cursorPhy)
	if clicks != 1 {
		t.Errorf("off clicks = %d, want 1", clicks)
	}
}
