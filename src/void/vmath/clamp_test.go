package vmath

import (
	"testing"
)

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
