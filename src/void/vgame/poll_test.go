package vgame

import (
	"testing"
	"unsafe"
)

// verify Go struct offsets match the TS layout constants in
// `src/void/vweb/input/layout.ts.`
func TestPollLayout(t *testing.T) {
	var poll Poll
	check := func(name string, got, want uintptr) {
		t.Helper()
		if got != want {
			t.Errorf("%s: offset %d, want %d", name, got, want)
		}
	}
	check("DeltaMs", unsafe.Offsetof(poll.DeltaMs), 4376)
	check("NowMs", unsafe.Offsetof(poll.NowMs), 4384)
	check("CanvasPhy.W", unsafe.Offsetof(poll.CanvasPhy), 4392)
	check("CanvasPhy.H", unsafe.Offsetof(poll.CanvasPhy)+2, 4394)
	check("Fullscreen", unsafe.Offsetof(poll.Fullscreen), 4396)
	check("DrawMs", unsafe.Offsetof(poll.DrawMs), 4400)
	check("DrawCount", unsafe.Offsetof(poll.DrawCount), 4408)
	check("UpdateMs", unsafe.Offsetof(poll.UpdateMs), 4416)
	check("DevicePixelRatio", unsafe.Offsetof(poll.DevicePixelRatio), 4424)
	check("sizeof(Poll)", unsafe.Sizeof(poll), 4432)
}
