package game

import (
	"testing"

	"github.com/oidoid/void/src/void/veng"
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
	if got := gam.WindowMode(); got != veng.Windowed {
		t.Errorf("WindowMode() = %v, want windowed", got)
	}
}
