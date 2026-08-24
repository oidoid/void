package entities_test

import (
	"testing"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vin"
)

// draws the lock overlay only while the browser has locked the canvas pointer.
func TestMouseStatusPointerlocked(t *testing.T) {
	for _, test := range []struct {
		name    string
		locked  bool
		sprsLen int
	}{
		{name: "unlocked", sprsLen: 1},
		{name: "locked", locked: true, sprsLen: 2},
	} {
		t.Run(test.name, func(t *testing.T) {
			gam := engine.New()
			gam.Frame().Pointerlocked = test.locked
			gam.Layer(gfx.LayerUI).Clip = vgeo.XYWH[float32](0, 0, 100, 100)
			poll := vin.InputPoll{PtrsLen: 1}
			poll.Ptrs[0] = vin.PointerPoll{
				Device: vin.PointerDeviceMouse, Primary: true,
			}
			gam.In().Update(0, &poll, vgeo.Box[float32]{})

			ent := entities.NewMouseStatusEnt()
			ent.Update(gam)
			sprs := gam.Layer(gfx.LayerUI).Sprs
			if got := len(sprs); got != test.sprsLen {
				t.Errorf("sprites = %v, want %v", got, test.sprsLen)
				return
			}
			if test.locked && sprs[1].TagCel != tags.MouseStatusLocked.Cel(0) {
				t.Errorf(
					"lock TagCel = %v, want %v",
					sprs[1].TagCel,
					tags.MouseStatusLocked.Cel(0),
				)
			}
		})
	}
}
