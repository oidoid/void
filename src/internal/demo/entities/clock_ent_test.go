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
		name   string
		millis uint64
		want   uint64
	}{
		{"zero", 0, 60_000},
		{"one", 1, 59_999},
		{"two", 2, 59_998},
		{"one second", 1_000, 59_000},
		{"one second one", 1_001, 58_999},
		{"last", 59_999, 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := millisToNextMin(test.millis); got != test.want {
				t.Errorf("millisToNextMin(%d) = %d, want %d",
					test.millis, got, test.want,
				)
			}
		})
	}
}
