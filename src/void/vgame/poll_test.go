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
			Wheel: vin.WheelPoll{
				Delta: vgeo.XYZ[float32]{
					XY: vgeo.NewXY[float32](1.5, -2.5), Z: 3.5,
				},
				Pinch: 4.5,
			},
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
		DeltaMillis:      16.5,
		NowMillis:        123.5,
		CanvasPhy:        vgeo.NewWH[uint16](640, 480),
		Fullscreen:       true,
		DrawAlways:       true,
		DrawCount:        3,
		UpdateMillis:     4.5,
		DevicePixelRatio: 2,
		UtcMillis:        1_767_000_000_123,
		TimeFormat: TimeFormat{
			Year: 2026, Month: 7, Day: 19, Hour: 7, Minute: 52, Second: 20, Milli: 123,
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
	check("DeltaMs", unsafe.Offsetof(poll.DeltaMillis), 4384)
	check("NowMs", unsafe.Offsetof(poll.NowMillis), 4392)
	check("UtcMs", unsafe.Offsetof(poll.UtcMillis), 4400)
	check("CanvasPhy.W", unsafe.Offsetof(poll.CanvasPhy), 4408)
	check("CanvasPhy.H", unsafe.Offsetof(poll.CanvasPhy)+2, 4410)
	check("Fullscreen", unsafe.Offsetof(poll.Fullscreen), 4412)
	check("DrawCount", unsafe.Offsetof(poll.DrawCount), 4416)
	check("UpdateMs", unsafe.Offsetof(poll.UpdateMillis), 4424)
	check("DevicePixelRatio", unsafe.Offsetof(poll.DevicePixelRatio), 4432)
	check("Time.Year", unsafe.Offsetof(poll.TimeFormat), 4440)
	check("Time.Month", unsafe.Offsetof(poll.TimeFormat)+2, 4442)
	check("Time.Day", unsafe.Offsetof(poll.TimeFormat)+3, 4443)
	check("Time.Hour", unsafe.Offsetof(poll.TimeFormat)+4, 4444)
	check("Time.Minute", unsafe.Offsetof(poll.TimeFormat)+5, 4445)
	check("Time.Second", unsafe.Offsetof(poll.TimeFormat)+6, 4446)
	check("Time.Millis", unsafe.Offsetof(poll.TimeFormat)+8, 4448)
	check("sizeof(Poll)", unsafe.Sizeof(poll), 4456)
}
