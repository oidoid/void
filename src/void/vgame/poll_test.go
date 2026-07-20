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
	check("Time.Year", unsafe.Offsetof(poll.TimeFormat), 4432)
	check("Time.Month", unsafe.Offsetof(poll.TimeFormat)+2, 4434)
	check("Time.Day", unsafe.Offsetof(poll.TimeFormat)+3, 4435)
	check("Time.Hour", unsafe.Offsetof(poll.TimeFormat)+4, 4436)
	check("Time.Minute", unsafe.Offsetof(poll.TimeFormat)+5, 4437)
	check("Time.Second", unsafe.Offsetof(poll.TimeFormat)+6, 4438)
	check("Time.Millis", unsafe.Offsetof(poll.TimeFormat)+8, 4440)
	check("sizeof(Poll)", unsafe.Sizeof(poll), 4448)
}
