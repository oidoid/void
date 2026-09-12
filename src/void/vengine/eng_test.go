package vengine

import (
	"testing"

	"github.com/oidoid/void/src/void/vgame"
)

type engineTestGame struct {
	*Eng[*engineTestGame]
}

func TestFullscreenReq(t *testing.T) {
	engine := New[*engineTestGame](nil)
	engine.ReqFullscreen(vgame.FullscreenReqEnter)
	want := int32(vgame.FullscreenReqEnter)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(vgame.FullscreenReqLandscape)
	want = int32(vgame.FullscreenReqLandscape)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.ReqFullscreen(vgame.FullscreenReqPortrait)
	want = int32(vgame.FullscreenReqPortrait)
	if got := engine.FullscreenReq(); got != want {
		t.Errorf("FullscreenReq() = %v, want %v", got, want)
	}

	engine.Poll().Fullscreen = true
	engine.ReqFullscreen(vgame.FullscreenReqExit)
	if got := engine.FullscreenReq(); got != int32(vgame.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}

func (*engineTestGame) Update() vgame.Status { return vgame.Pause }

// starts windowed and accepts an explicit override.
func TestFullscreenPlatformDefault(t *testing.T) {
	engine := New[*engineTestGame](nil)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	engine.BeginTick()
	if got := engine.FullscreenReq(); got != int32(vgame.FullscreenReqNone) {
		t.Errorf("FullscreenReq() = %v, want none", got)
	}

	engine.Poll().FullscreenReq = vgame.FullscreenReqLandscape
	engine.BeginTick()
	if !engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = false, want true")
	}
	if got := engine.FullscreenReq(); got != int32(vgame.FullscreenReqLandscape) {
		t.Errorf("FullscreenReq() = %v, want landscape", got)
	}

	engine.ReqFullscreen(vgame.FullscreenReqExit)
	if engine.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := engine.FullscreenReq(); got != int32(vgame.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}
