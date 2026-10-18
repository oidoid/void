package veng

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

//go:generate go run github.com/oidoid/void/src/cmd/genbridge ../vweb/eng/bridge.ts

// all Go outputs and bookkeeping consumed by web. written by Go, read by web.
// pointers are just byte offsets into the single linear chunk of Wasm memory
// (not `Out` itself).
// `BeginTick()` clears one-shot requests, update delays, and beep count.
// `FullscreenReq` persists so requests can be retried during user activation.
// to-do: should `FullscreenReq` be limited?
type Out struct {
	UpdateInMillis uint64
	Cam            vgeo.XY[float32]
	BoardTilesPtr  uint32
	BoardTilesLen  uint32
	BoardW         int32
	BoardH         int32
	BoardLevel     uint16
	BoardTileW     uint8
	BoardTileH     uint8
	AtlasMetaPtr   uint32
	AtlasMetaCount uint32
	AtlasCelsPtr   uint32
	AtlasCelsCount uint32
	FullscreenReq  FullscreenReq
	DrawAlways     bool
	DrawOnBlur     bool
	RenderMode     vgfx.RenderMode
	Requests       uint8
	BeepCount      uint32
	Beeps          [16]Beep
	Layers         [vgfx.LayerCount]vgfx.LayerConfigExport
}

const (
	OutReqMask             = 1
	OutReqScreenshotShift  = 0
	OutReqContextLossShift = 1
)
