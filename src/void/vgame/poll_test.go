package vgame

import (
	"testing"
	"unsafe"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

func TestPollSerializationRoundTrip(t *testing.T) {
	want := Poll{
		InputPoll: vin.InputPoll{
			PtrsLen: 1,
			Ptrs: [vin.MaxPointers]vin.PointerPoll{{
				ID:       7,
				Phy:      vgeo.NewBox[float32](10, 20, 13, 24),
				Pressure: 0.5,
				Tilt:     vgeo.NewXY[int8](-1, 2),
				Twist:    30,
				Device:   vin.PointerDevicePen,
				Primary:  true,
				Clicks:   vin.ClickPrimary | vin.ClickAux,
			}},
			Wheel: vin.WheelPoll{Delta: vgeo.XYZ[float32]{
				XY: vgeo.NewXY[float32](1.5, -2.5), Z: 3.5,
			}},
			Kbd:     vin.KeyboardPoll{Keys: vin.KeyUp | vin.KeyLeft, TextLen: 11},
			PadsLen: 1,
			Pads: [vin.MaxGamepads]vin.GamepadPoll{{
				Index:     3,
				Connected: true,
				Mapping:   vin.GamepadMappingStandard,
				Buttons:   vin.GamepadButtonA | vin.GamepadButtonX,
				Axes:      [4]float32{-1, -0.5, 0.5, 1},
			}},
		},
		DeltaMs:          16.5,
		NowMs:            1_767_000_000_123.5,
		CanvasPhy:        vgeo.WH[uint16]{W: 640, H: 480},
		Fullscreen:       true,
		DrawAlways:       true,
		DrawMs:           2.5,
		DrawCount:        3,
		UpdateMs:         4.5,
		DevicePixelRatio: 2,
		TimeFormat: TimeFormat{
			Year: 2026, Month: 7, Day: 19, Hour: 7, Minute: 52, Second: 20, Millis: 123,
		},
	}
	copy(want.InputPoll.Kbd.Text[:], "hello world")

	serialized := append([]byte(nil), unsafe.Slice((*byte)(unsafe.Pointer(&want)), unsafe.Sizeof(want))...)
	var got Poll
	copy(unsafe.Slice((*byte)(unsafe.Pointer(&got)), unsafe.Sizeof(got)), serialized)

	if got != want {
		t.Errorf("deserialized Poll = %#v, want %#v", got, want)
	}
}

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
