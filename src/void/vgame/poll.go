package vgame

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

type Poll struct {
	InputPoll vin.InputPoll
	// time since the last frame was _requested_ in milliseconds.
	DeltaMs float64
	// UTC timestamp from `performance.timeOrigin + performance.now()`.
	NowMs      float64
	CanvasPhy  vgeo.WH[uint16]
	Fullscreen bool
	DrawAlways bool
	_          [2]byte
	DrawMs     float64 // to-do: delete.
	// number of renderer clears completed.
	DrawCount int32
	_         [4]byte
	// duration of the previous Go update call in milliseconds.
	UpdateMs         float64
	DevicePixelRatio float64
	// local time for `NowMs`.
	TimeFormat TimeFormat
}

type TimeFormat struct {
	Year   uint16 // Gregorian year.
	Month  uint8  // 1-12.
	Day    uint8  // 1-31.
	Hour   uint8  // 0-23.
	Minute uint8  // 0-59.
	Second uint8  // 0-59.
	_      byte
	Millis uint16 // 0-999.
	_      [2]byte
}
