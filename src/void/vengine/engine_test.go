package vengine

import (
	"testing"

	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type engineTestGame struct {
	*Engine[*engineTestGame]
}

func (*engineTestGame) Update() vgame.Status { return vgame.Pause }

// starts fullscreen and wakelock enabled until an app disables either.
func TestFullscreenAndWakelockDefaultOn(t *testing.T) {
	var engine Engine[*engineTestGame]
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

func TestRegisterEntVec(t *testing.T) {
	var engine Engine[*engineTestGame]
	updates := 0
	vec := engine.RegisterEntVec(func(
		vec *vvec.Vec[int], gam *engineTestGame,
	) vgame.Status {
		updates += vec.Len()
		return vgame.Loop
	})
	vec.Add(1)
	vec.Add(2)
	gam := &engineTestGame{Engine: &engine}
	if got := engine.updaters.Update(gam); got != vgame.Loop {
		t.Errorf("Update() = %v, want %v", got, vgame.Loop)
	}
	if updates != 2 {
		t.Errorf("updates = %v, want 2", updates)
	}
}
