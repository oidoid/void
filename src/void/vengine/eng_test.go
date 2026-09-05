package vengine

import (
	"testing"

	"github.com/oidoid/void/src/void/vgame"
)

type engineTestGame struct {
	*Eng[*engineTestGame]
}

func (*engineTestGame) Update() vgame.Status { return vgame.Pause }

// starts fullscreen and wakelock enabled until an app disables either.
func TestFullscreenAndWakelockDefaultOn(t *testing.T) {
	var engine Eng[*engineTestGame]
	if engine.FullscreenDisabled() {
		t.Error("FullscreenDisabled() = true, want false")
	}
	if engine.WakelockDisabled() {
		t.Error("WakelockDisabled() = true, want false")
	}
	engine.DisableFullscreen(true)
	if !engine.FullscreenDisabled() {
		t.Error("FullscreenDisabled() = false, want true")
	}
	if got := engine.FullscreenRequest(); got != int32(vgame.FullscreenRequestExit) {
		t.Errorf("FullscreenRequest() = %v, want exit", got)
	}
	engine.DisableWakelock(true)
	if !engine.WakelockDisabled() {
		t.Error("WakelockDisabled() = false, want true")
	}
	if got := engine.RequestWakelockFlag(); got != 0 {
		t.Errorf("RequestWakelockFlag() = %v, want 0", got)
	}
}
