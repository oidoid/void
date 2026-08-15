package entities

import (
	"testing"

	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

// draws the lock overlay only while the browser has locked the canvas pointer.
func TestMouseStatusPointerlocked(t *testing.T) {
	tests := []struct {
		name    string
		locked  bool
		sprsLen int
	}{
		{"unlocked", false, 1},
		{"locked", true, 2},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := NewMouseStatusEnt()
			ent.visible = true
			sprs := []vgfx.Spr{}
			ent.Update(
				&sprs, vin.NewIn(), test.locked,
				vgeo.NewBox[float32](0, 0, 100, 100),
			)
			if got := len(sprs); got != test.sprsLen {
				t.Errorf("sprites = %v, want %v", got, test.sprsLen)
				return
			}
			if test.locked && sprs[1].AnimCel != assets.MouseStatusLocked.Cel(0) {
				t.Errorf("lock AnimCel = %v, want %v", sprs[1].AnimCel,
					assets.MouseStatusLocked.Cel(0))
			}
		})
	}
}
