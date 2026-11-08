package vgeo

import "testing"

func TestXYArithmetic(t *testing.T) {
	tests := []struct {
		name string
		got  XY[int]
		want XY[int]
	}{
		{name: "add", got: NewXY(6, -4).Add(NewXY(-2, 7)), want: NewXY(4, 3)},
		{name: "sub", got: NewXY(6, -4).Sub(NewXY(-2, 7)), want: NewXY(8, -11)},
		{name: "mul", got: NewXY(6, -4).Mul(3), want: NewXY(18, -12)},
		{name: "div", got: NewXY(6, -4).Div(2), want: NewXY(3, -2)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.got != test.want {
				t.Errorf("got %v, want %v", test.got, test.want)
			}
		})
	}
}

func TestGeometryConversions(t *testing.T) {
	if got, want := NewXY[int8](-2, 3).Cast[float32](),
		NewXY[float32](-2, 3); got != want {
		t.Errorf("XY.Cast() = %v, want %v", got, want)
	}
	if got, want := NewBox[int8](-2, 3, 4, 5).Cast[float32](),
		NewBox[float32](-2, 3, 4, 5); got != want {
		t.Errorf("Box.Cast() = %v, want %v", got, want)
	}
}

func TestRoundXY(t *testing.T) {
	for _, test := range []struct {
		name string
		xy   XY[float32]
		want XY[float32]
	}{
		{"integral", NewXY[float32](1, -2), NewXY[float32](1, -2)},
		{"below half", NewXY[float32](1.49, -1.49), NewXY[float32](1, -1)},
		{"above half", NewXY[float32](1.51, -1.51), NewXY[float32](2, -2)},
		{"positive ties up", NewXY[float32](.5, 1.5), NewXY[float32](1, 2)},
		{"negative ties toward positive", NewXY[float32](-.5, -1.5), NewXY[float32](0, -1)},
		{"subpixel stays near zero", NewXY[float32](-.49, .49), NewXY[float32](0, 0)},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := RoundXY(test.xy); got != test.want {
				t.Errorf("RoundXY(%v) = %v, want %v", test.xy, got, test.want)
			}
		})
	}
}

func TestXYCastTruncatesTowardZero(t *testing.T) {
	for _, test := range []struct {
		name string
		xy   XY[float32]
		want XY[int16]
	}{
		{"positive fraction", NewXY[float32](.9, 1.5), NewXY[int16](0, 1)},
		{"negative fraction", NewXY[float32](-.9, -1.5), NewXY[int16](0, -1)},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := test.xy.Cast[int16](); got != test.want {
				t.Errorf("Cast() = %v, want %v", got, test.want)
			}
		})
	}
}
