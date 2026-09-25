package game

import (
	"testing"

	"github.com/oidoid/void/src/void/vengine"
)

// requests windowed mode from the default fullscreen setting.
func TestFullscreenToggle(t *testing.T) {
	gam := NewGame()
	toggle := NewFullscreenToggle(gam)
	toggle.OnUpdate(toggle)
	if toggle.On {
		t.Error("toggle.On = true, want false")
	}
	toggle.On = true
	toggle.OnClick(toggle)
	if gam.FullscreenEnabled() {
		t.Error("FullscreenEnabled() = true, want false")
	}
	if got := gam.FullscreenReq(); got != int32(vengine.FullscreenReqExit) {
		t.Errorf("FullscreenReq() = %v, want exit", got)
	}
}
