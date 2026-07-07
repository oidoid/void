package vmath

import "testing"

func TestClamp(t *testing.T) {
	cases := []struct {
		name     string
		lo, hi   int
		in, want int
	}{
		{"within", 0, 10, 5, 5},
		{"at lo", 0, 10, 0, 0},
		{"at hi", 0, 10, 10, 10},
		{"below lo", 0, 10, -3, 0},
		{"above hi", 0, 10, 13, 10},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Clamp(test.lo, test.hi, test.in); got != test.want {
				t.Fatalf(
					"Clamp(%v,%v,%v) = %v, want %v",
					test.lo,
					test.hi,
					test.in,
					got,
					test.want,
				)
			}
		})
	}
}

func TestFloor(t *testing.T) {
	cases := []struct {
		name string
		in   float32
		want float32
	}{
		{"zero", 0, 0},
		{"positive whole", 3, 3},
		{"positive frac", 1.9, 1},
		{"negative whole", -2, -2},
		{"negative frac", -1.1, -2},
		{"negative half", -0.5, -1},
		{"positive half", 0.5, 0},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Floor(test.in); got != test.want {
				t.Fatalf("Floor(%v) = %v, want %v", test.in, got, test.want)
			}
		})
	}
}
