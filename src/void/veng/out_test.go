package veng

import (
	"testing"
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestOutSnapshot(t *testing.T) {
	eng := NewEng(&EngOpts{MaxSprs: 1, RenderMode: vgfx.RenderModePixel})
	eng.Atlas().Cels = []vatlas.Cel{{Millis: 7}, {Millis: 8}}
	eng.Atlas().Meta = make([]vatlas.TagMeta, 1)
	*eng.Cam() = vgeo.NewXY[float32](-1.25, 2.5)
	layer := eng.Layer(0)
	layer.CamMode = vgfx.LayerCamModeFixed
	layer.Scale = 1.5
	layer.Depth = true
	layer.BlendMode = vgfx.LayerBlendModeMultiply
	layer.Sprs = append(layer.Sprs, vgfx.Spr{})
	ptr := eng.OutPtr()
	out := &eng.out
	if ptr != uintptr(unsafe.Pointer(out)) {
		t.Fatal("OutPtr() does not point to the shared output")
	}
	if out.Cam != *eng.Cam() || out.RenderMode != vgfx.RenderModePixel {
		t.Error("initial output lost camera or render mode")
	}
	if out.AtlasMetaCount != 1 || out.AtlasMetaPtr == 0 || out.AtlasCelsCount != 2 ||
		out.AtlasCelsPtr != uint32(uintptr(unsafe.Pointer(&eng.atlas.Cels[0]))) {
		t.Error("initial output lost atlas metadata")
	}
	exported := out.Layers[0]
	if exported.Scale != 1.5 || exported.CamMode != vgfx.LayerCamModeFixed ||
		exported.SprCount != 1 || exported.SprsPtr == 0 ||
		exported.Flags != vgfx.LayerFlagsDepthFlag|
			uint8(vgfx.LayerBlendModeMultiply)<<vgfx.LayerFlagsBlendModeShift {
		t.Errorf("initial layer = %+v", exported)
	}

	eng.BeginTick()
	eng.Atlas().Cels = nil
	eng.Atlas().Meta = nil
	layer.Scale = 2.25
	eng.EndTick(Pause)
	if out.AtlasMetaCount != 0 || out.AtlasMetaPtr != 0 || out.AtlasCelsCount != 0 || out.AtlasCelsPtr != 0 ||
		out.Layers[0].SprCount != 0 ||
		out.Layers[0].SprsPtr != 0 || out.Layers[0].Scale != 2.25 {
		t.Error("EndTick() did not refresh the shared snapshot")
	}
	if eng.OutPtr() != ptr {
		t.Error("OutPtr() changed after an update")
	}
}

func TestOutRequests(t *testing.T) {
	eng := NewEng(&EngOpts{MaxSprs: 1})
	eng.BeginTick()
	eng.ReqFullscreen(FullscreenReqLandscape)
	eng.ReqScreenshot()
	eng.ReqContextLoss()
	eng.ReqUpdateInMillis(125)
	eng.EndTick(Pause)
	out := &eng.out
	want := uint8(OutReqMask<<OutReqScreenshotShift |
		OutReqMask<<OutReqContextLossShift)
	if out.Requests != want || out.UpdateInMillis != 125 {
		t.Fatal("output lost pending requests")
	}
	eng.OutPtr()
	if out.Requests != want || out.UpdateInMillis != 125 {
		t.Error("reading OutPtr() consumed requests")
	}

	eng.BeginTick()
	eng.EndTick(Pause)
	if out.Requests != 0 || out.UpdateInMillis != 0 {
		t.Error("one-shot requests were replayed on the next frame")
	}
	if out.FullscreenReq != FullscreenReqLandscape {
		t.Error("fullscreen intent did not persist for browser retries")
	}
	eng.ReqUpdateInMillis(125)
	eng.ReqUpdateInMillis(0)
	eng.ReqScreenshot()
	eng.EndTick(Pause)
	if out.UpdateInMillis != 0 {
		t.Error("zero did not cancel the update request")
	}
	if out.Requests != OutReqMask<<OutReqScreenshotShift {
		t.Error("new requests did not survive EndTick()")
	}
}

func TestOutBeeps(t *testing.T) {
	eng := NewEng(&EngOpts{MaxSprs: 1})
	beep := Beep{StartHz: 440, EndHz: 880, DurationMs: 250, DelayMs: 10}
	for i := 0; i < len(eng.out.Beeps)+1; i++ {
		eng.Beep(beep)
	}
	eng.EndTick(Pause)
	if eng.out.BeepCount != uint32(len(eng.out.Beeps)) {
		t.Fatal("beep queue exceeded the shared buffer")
	}
	for _, got := range eng.out.Beeps {
		if got != beep {
			t.Errorf("shared beep = %+v, want %+v", got, beep)
		}
	}
	eng.BeginTick()
	eng.EndTick(Pause)
	if eng.out.BeepCount != 0 {
		t.Error("beeps were replayed on the next frame")
	}
}
