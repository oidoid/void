package vengine

import (
	"testing"
)

type engineTestGame struct {
	*Eng[*engineTestGame]
}

func TestFullscreenReq(t *testing.T) {
	engine := New[*engineTestGame](nil)
	engine.ReqFullscreen(FullscreenReqEnter)
	want := int32(FullscreenReqEnter)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(FullscreenReqLandscape)
	want = int32(FullscreenReqLandscape)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(FullscreenReqPortrait)
	want = int32(FullscreenReqPortrait)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.Poll().Fullscreen = true
	engine.ReqFullscreen(FullscreenReqExit)
	if got := engine.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

func (*engineTestGame) Update() Status { return Pause }

// starts windowed and accepts an explicit override.
func TestFullscreenPlatformDefault(t *testing.T) {
	engine := New[*engineTestGame](nil)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	engine.BeginTick()
	if got := engine.FullscreenReq(); got != int32(FullscreenReqNone) {
		t.Errorf("FullscreenReq() = %v, want none", got)
	}

	engine.Poll().FullscreenReq = FullscreenReqLandscape
	engine.BeginTick()
	if !engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = false, want true")
	}
	if got := engine.FullscreenReq(); got != int32(FullscreenReqLandscape) {
		t.Errorf("FullscreenReq() = %v, want landscape", got)
	}

	engine.ReqFullscreen(FullscreenReqExit)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := engine.FullscreenReq(); got != int32(FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}
