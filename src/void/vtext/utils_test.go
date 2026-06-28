package vtext

import "testing"

func TestItoa(t *testing.T) {
	cases := []struct {
		num  int
		want string
	}{
		{0, "0"},
		{7, "7"},
		{42, "42"},
		{-7, "-7"},
		{-42, "-42"},
	}
	for _, test := range cases {
		if got := Itoa(test.num); got != test.want {
			t.Fatalf("Itoa(%d) = %q, want %q", test.num, got, test.want)
		}
	}
}

func TestFmtFloat(t *testing.T) {
	cases := []struct {
		num  float32
		want string
	}{
		{0, "0.0"},
		{1.6, "1.6"},
		{-1.6, "-1.6"},
		{-0.6, "-0.6"},
	}
	for _, test := range cases {
		if got := FmtFloat(test.num); got != test.want {
			t.Fatalf("FmtFloat(%f) = %q, want %q", test.num, got, test.want)
		}
	}
}

func TestPadInt(t *testing.T) {
	cases := []struct {
		num   int
		width int
		want  string
	}{
		{0, 3, "  0"},
		{7, 3, "  7"},
		{123, 3, "123"},
		{1234, 3, "1234"},
	}
	for _, test := range cases {
		if got := PadInt(test.num, test.width); got != test.want {
			t.Fatalf("PadInt(%d, %d) = %q, want %q", test.num, test.width, got, test.want)
		}
	}
}
