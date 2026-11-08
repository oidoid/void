package vgeo

import (
	"math"
	"testing"
)

func TestBoxHitsBox(t *testing.T) {
	bounds := XYWH[float32](-5, -5, 10, 10)
	for _, test := range []struct {
		name string
		box  Box[float32]
		want bool
	}{
		{"overlap", XYWH[float32](4, 4, 2, 2), true},
		{"inside", XYWH[float32](-1, -1, 2, 2), true},
		{"encloses", XYWH[float32](-8, -8, 16, 16), true},
		{"identical", bounds, true},
		{"east contact", XYWH[float32](5, -1, 2, 2), false},
		{"west contact", XYWH[float32](-7, -1, 2, 2), false},
		{"north contact", XYWH[float32](-1, -7, 2, 2), false},
		{"south contact", XYWH[float32](-1, 5, 2, 2), false},
		{"corner contact", XYWH[float32](5, 5, 2, 2), false},
		{"subpixel overlap", XYWH(math.Nextafter32(5, 0), -1, 2, 2), true},
		{"subpixel gap", XYWH(math.Nextafter32(5, 6), -1, 2, 2), false},
		{"zero box", Box[float32]{}, false},
		{"empty width", XYWH[float32](0, -1, 0, 2), false},
		{"empty height", XYWH[float32](-1, 0, 2, 0), false},
		{"inverted width", NewBox[float32](1, -1, -1, 1), false},
		{"inverted height", NewBox[float32](-1, 1, 1, -1), false},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := bounds.HitsBox(test.box); got != test.want {
				t.Errorf("HitsBox(%v) = %v, want %v", test.box, got, test.want)
			}
			if got := test.box.HitsBox(bounds); got != test.want {
				t.Errorf("reversed HitsBox(%v) = %v, want %v",
					test.box, got, test.want)
			}
		})
	}
}

func TestBoxHitsPoint(t *testing.T) {
	box := XYWH[float32](-5, -5, 10, 10)
	for _, test := range []struct {
		name string
		xy   XY[float32]
		want bool
	}{
		{"center", NewXY[float32](0, 0), true},
		{"min corner inclusive", NewXY[float32](-5, -5), true},
		{"max corner exclusive", NewXY[float32](5, 5), false},
		{"east edge exclusive", NewXY[float32](5, 0), false},
		{"south edge exclusive", NewXY[float32](0, 5), false},
		{"just inside max", NewXY(math.Nextafter32(5, 0), math.Nextafter32(5, 0)), true},
		{"outside west", NewXY[float32](-6, 0), false},
		{"outside north", NewXY[float32](0, -6), false},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := box.HitsXY(test.xy); got != test.want {
				t.Errorf("HitsXY(%v) = %v, want %v", test.xy, got, test.want)
			}
		})
	}
}

func TestBoxCastTruncatesTowardZero(t *testing.T) {
	for _, test := range []struct {
		name string
		box  Box[float32]
		want Box[int16]
	}{
		{"integral", NewBox[float32](-2, 3, 4, 5), NewBox[int16](-2, 3, 4, 5)},
		{"positive fraction", NewBox[float32](.9, 1.5, 2.1, 3.99), NewBox[int16](0, 1, 2, 3)},
		{"negative fraction", NewBox[float32](-.9, -1.5, -2.1, -3.99), NewBox[int16](0, -1, -2, -3)},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := test.box.Cast[int16](); got != test.want {
				t.Errorf("Cast() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestBoxXYWHAndSize(t *testing.T) {
	for _, test := range []struct {
		name string
		box  Box[int]
		w, h int
	}{
		{"positive", XYWH(1, 2, 3, 4), 3, 4},
		{"negative origin", XYWH(-3, -4, 3, 4), 3, 4},
		{"zero size", XYWH(5, 5, 0, 0), 0, 0},
		{"inverted", NewBox(3, 4, 1, 2), -2, -2},
	} {
		t.Run(test.name, func(t *testing.T) {
			if test.box.W() != test.w || test.box.H() != test.h {
				t.Errorf("WH = %dx%d, want %dx%d",
					test.box.W(), test.box.H(), test.w, test.h)
			}
		})
	}
}

func TestBoxMoveTo(t *testing.T) {
	box := XYWH(1, 2, 3, 4)
	box.MoveTo(NewXY(-10, 20))
	if want := XYWH(-9, 22, 3, 4); box != want {
		t.Errorf("MoveTo() = %v, want %v", box, want)
	}
}
