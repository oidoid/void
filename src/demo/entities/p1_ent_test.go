package entities

import (
	"testing"

	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vlevels"
)

func TestNewP1Ent(t *testing.T) {
	anim := vatlas.Anim{
		W:       8,
		H:       13,
		Hurtbox: vgeo.XYWH[uint16](2, 0, 4, 4),
	}
	ent := NewP1Ent(vgeo.XY[float32]{}, anim)
	if got, want := ent.WH, (vgeo.WH[uint16]{W: 8, H: 13}); got != want {
		t.Fatalf("WH = %v, want %v", got, want)
	}
	if got, want := ent.Hurtbox, anim.Hurtbox; got != want {
		t.Fatalf("Hurtbox = %v, want %v", got, want)
	}
	if got, want := ent.Dir, vgeo.DirE; got != want {
		t.Fatalf("Dir = %v, want %v", got, want)
	}
}

func TestP1EntTurnsRightAtWalls(t *testing.T) {
	tiles := make([]vatlas.AnimID, 64)
	for x := range 8 {
		tiles[x] = assets.TileStripesGrey
		tiles[56+x] = assets.TileStripesGrey
	}
	for y := range 8 {
		tiles[y*8] = assets.TileStripesGrey
		tiles[y*8+7] = assets.TileStripesGrey
	}
	level := vlevels.Level{
		Box:   vgeo.XYWH[int32](0, 0, 128, 128),
		Tile:  vgeo.WH[uint8]{W: 16, H: 16},
		Tiles: tiles,
	}
	ent := NewP1Ent(vgeo.XY[float32]{X: 32, Y: 32}, vatlas.Anim{
		W: 1, H: 1, Hurtbox: vgeo.XYWH[uint16](0, 0, 1, 1),
	})
	wants := []struct {
		xy    vgeo.XY[float32]
		dir   vgeo.Dir
		moves int
	}{
		{xy: vgeo.XY[float32]{X: 112 - vgfx.Epsilon, Y: 32}, dir: vgeo.DirS, moves: 20},
		{xy: vgeo.XY[float32]{X: 112 - vgfx.Epsilon, Y: 112 - vgfx.Epsilon}, dir: vgeo.DirW, moves: 20},
		{xy: vgeo.XY[float32]{X: 16, Y: 112 - vgfx.Epsilon}, dir: vgeo.DirN, moves: 24},
		{xy: vgeo.XY[float32]{X: 16, Y: 16}, dir: vgeo.DirE, moves: 24},
	}
	for _, want := range wants {
		for range want.moves {
			ent.Move(500, &level)
		}
		if ent.XY != want.xy || ent.Dir != want.dir {
			t.Fatalf("P1 = (%v, %v), want (%v, %v)", ent.XY, ent.Dir, want.xy, want.dir)
		}
	}
}
