package vgame

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

type Poll struct {
	InPoll vin.InPoll
	// time since the last frame was _requested_ in milliseconds.
	DeltaMillis float64
	// millis since the performance time origin.
	// note: `performance.timeOrigin + performance.now()` is not UTC time when the
	// OS has been suspended.
	NowMillis  float64
	UtcMillis  uint64
	CanvasPhy  vgeo.WH[uint16]
	Fullscreen bool
	DrawAlways bool
	// URL override: none defers to the engine; off represents `debug=zzz`.
	RequestWakelock WakelockRequest
	Wakelocked      bool

	// number of renderer clears completed.
	DrawCount         int32
	RequestFullscreen FullscreenRequest
	Pointerlocked     bool
	_                 [2]byte
	// duration of the previous Go update call in milliseconds.
	UpdateMillis     float64
	DevicePixelRatio float64
	TimeFormat       TimeFormat
}

type WakelockRequest int8

const (
	WakelockRequestNone WakelockRequest = iota
	WakelockRequestOff  WakelockRequest = -1
)

type FullscreenRequest uint8

const (
	FullscreenRequestNone FullscreenRequest = iota
	FullscreenRequestEnter
	FullscreenRequestExit
)

// reports the time since the last requested frame in sec.
func (this *Poll) DeltaSecs() float64 { return this.DeltaMillis / 1000 }

// local time.
type TimeFormat struct {
	Year   uint16 // Gregorian year.
	Month  uint8  // 1-12.
	Day    uint8  // 1-31.
	Hour   uint8  // 0-23.
	Minute uint8  // 0-59.
	Second uint8  // 0-59.
	_      byte
	Milli  uint16 // 0-999.
	_      [2]byte
}
