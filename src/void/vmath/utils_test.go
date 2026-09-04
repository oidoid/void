package vmath

import (
	"math"
	"testing"
)

func TestAbs(t *testing.T) {
	cases := []struct {
		name     string
		in, want int
	}{
		{"zero", 0, 0},
		{"positive", 3, 3},
		{"negative", -3, 3},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Abs(test.in); got != test.want {
				t.Fatalf("Abs(%v) = %v, want %v", test.in, got, test.want)
			}
		})
	}
}

func TestCeil(t *testing.T) {
	cases := []struct {
		name string
		in   float32
		want float32
	}{
		{"zero", 0, 0},
		{"positive whole", 3, 3},
		{"positive float", 1.1, 2},
		{"negative whole", -2, -2},
		{"negative float", -1.9, -1},
		{"negative half", -0.5, 0},
		{"positive half", 0.5, 1},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Ceil(test.in); got != test.want {
				t.Fatalf("Ceil(%v) = %v, want %v", test.in, got, test.want)
			}
		})
	}
}

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

func TestFinite(t *testing.T) {
	cases := []struct {
		name string
		in   float32
		want bool
	}{
		{"zero", 0, true},
		{"positive", 1, true},
		{"negative", -1, true},
		{"NaN", float32(math.NaN()), false},
		{"positive infinity", float32(math.Inf(1)), false},
		{"negative infinity", float32(math.Inf(-1)), false},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Finite(test.in); got != test.want {
				t.Fatalf("Finite(%v) = %t, want %t", test.in, got, test.want)
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
		{"positive float", 1.9, 1},
		{"negative whole", -2, -2},
		{"negative float", -1.1, -2},
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

func TestRound(t *testing.T) {
	cases := []struct {
		name string
		in   float32
		want float32
	}{
		{"zero", 0, 0},
		{"positive down", 1.4, 1},
		{"positive half", 1.5, 2},
		{"negative up", -1.4, -1},
		{"negative half", -1.5, -2},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := Round(test.in); got != test.want {
				t.Fatalf("Round(%v) = %v, want %v", test.in, got, test.want)
			}
		})
	}
	if got := Round(2); got != 2 {
		t.Fatalf("Round(2) = %v, want 2", got)
	}
}
