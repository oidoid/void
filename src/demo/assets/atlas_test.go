package assets

import (
	"testing"

	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestSuperballHitbox(t *testing.T) {
	atlas := vatlas.DecodeAtlas(AtlasBin)
	if got, want := atlas.Anims[int(tags.SuperballDefault)].Hitbox,
		vgeo.XYWH[uint16](1, 1, 6, 6); got != want {
		t.Fatalf("Superball hitbox = %v, want %v", got, want)
	}
}
