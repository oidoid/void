package assets

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestGeneratedNativeTiles(t *testing.T) {
	if Tile5-Tile0 != 5 {
		t.Fatalf("native tile IDs are not contiguous")
	}
	atlas := vatlas.DecodeAtlas(AtlasBin)
	for animID := int(Tile0); animID <= int(Tile5); animID++ {
		anim := atlas.Anims[animID]
		if anim.Cels != 1 || anim.W != 16 || anim.H != 16 {
			t.Errorf("native tile %d anim = %#v", animID-int(Tile0), anim)
		}
	}
}

func TestSuperballHitbox(t *testing.T) {
	atlas := vatlas.DecodeAtlas(AtlasBin)
	if got, want := atlas.Anims[int(SuperballDefault)].Hitbox,
		vgeo.XYWH[uint16](1, 1, 6, 6); got != want {
		t.Fatalf("Superball hitbox = %v, want %v", got, want)
	}
}
