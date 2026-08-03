package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestAnimStartFrame(t *testing.T) {
	tests := []struct {
		name      string
		nowMillis float64
		want      uint8
	}{
		{name: "first frame", nowMillis: 0},
		{name: "next frame", nowMillis: float64(vatlas.CelMillis), want: 15},
		{name: "last frame", nowMillis: float64(vatlas.CelMillis * 15), want: 1},
		{name: "loop", nowMillis: float64(vatlas.MaxAnimLoopMillis)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := AnimStartCel(test.nowMillis)
			if got != test.want {
				t.Fatalf("AnimStartFrame() = %d, want %d", got, test.want)
			}
		})
	}
}

func TestIsAnimLooped(t *testing.T) {
	const startMillis = 100.
	tests := []struct {
		name      string
		nowMillis float64
		want      bool
	}{
		{name: "before start", nowMillis: startMillis - 1},
		{name: "start", nowMillis: startMillis},
		{name: "last cel", nowMillis: startMillis + vatlas.CelMillis*2},
		{name: "loop", nowMillis: startMillis + vatlas.CelMillis*3, want: true},
		{name: "after loop", nowMillis: startMillis + vatlas.CelMillis*4, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			anim := vatlas.Anim{Cels: 3}
			got := IsAnimLooped(anim, startMillis, test.nowMillis)
			if got != test.want {
				t.Fatalf("IsAnimLooped() = %t, want %t", got, test.want)
			}
		})
	}
}
