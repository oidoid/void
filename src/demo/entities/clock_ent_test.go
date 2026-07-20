package entities

import (
	"testing"

	"github.com/oidoid/void/src/void/vgame"
)

func TestTimeString(t *testing.T) {
	for _, test := range []struct {
		name string
		hour int
		min  int
		sec  int
		want string
	}{
		{"midnight", 0, 0, 0, "12:00:00"},
		{"midnight second", 0, 0, 1, "12:00:01"},
		{"morning", 1, 5, 0, "1:05:00"},
		{"noon", 12, 1, 0, "12:01:00"},
		{"afternoon", 13, 0, 0, "1:00:00"},
		{"late night", 23, 59, 0, "11:59:00"},
	} {
		t.Run(test.name, func(t *testing.T) {
			time := vgame.TimeFormat{
				Hour: uint8(test.hour), Minute: uint8(test.min), Second: uint8(test.sec),
			}
			if got := timeString(time); got != test.want {
				t.Errorf("timeString() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestMillisToNextMin(t *testing.T) {
	for _, test := range []struct {
		millis float64
		want   float64
	}{
		{0, 60_000},
		{1, 59_999},
		{59_999, 1},
		{60_000, 60_000},
		{123_456_789, 23_211},
	} {
		if got := millisToNextMin(test.millis); got != test.want {
			t.Errorf("millisToNextMin(%f) = %f, want %f", test.millis, got, test.want)
		}
	}
}
