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
