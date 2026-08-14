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
	if got, want := ent.WH, vgeo.NewWH[uint16](8, 13); got != want {
		t.Fatalf("WH = %v, want %v", got, want)
	}
	if got, want := ent.Hurtbox, anim.Hurtbox; got != want {
		t.Fatalf("Hurtbox = %v, want %v", got, want)
	}
	if got, want := ent.Dir, vgeo.DirE; got != want {
		t.Fatalf("Dir = %v, want %v", got, want)
	}
}

func TestP1EntDrawsWhenSpriteHitsClip(t *testing.T) {
	clip := vgeo.XYWH[float32](0, 0, 10, 10)
	level := vlevels.Level{Box: vgeo.XYWH[int32](0, 0, 10, 10)}
	tests := []struct {
		name string
		x    float32
		want int
	}{
		{name: "overlaps left edge", x: -7, want: 1},
		{name: "touches left edge", x: -8, want: 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := NewP1Ent(vgeo.NewXY(test.x, float32(0)), vatlas.Anim{
				W: 8, H: 13,
			})
			var sprs []vgfx.Spr
			ent.Update(&sprs, clip, 0, &level)
			if got := len(sprs); got != test.want {
				t.Fatalf("sprites = %v, want %v", got, test.want)
			}
		})
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
		Tile:  vgeo.NewWH[uint8](16, 16),
		Tiles: tiles,
	}
	ent := NewP1Ent(vgeo.NewXY[float32](32, 32), vatlas.Anim{
		W: 1, H: 1, Hurtbox: vgeo.XYWH[uint16](0, 0, 1, 1),
	})
	wants := []struct {
		xy    vgeo.XY[float32]
		dir   vgeo.Dir
		moves int
	}{
		{xy: vgeo.NewXY(112-vgfx.Epsilon, 32), dir: vgeo.DirS, moves: 20},
		{
			xy:    vgeo.NewXY(112-vgfx.Epsilon, 112-vgfx.Epsilon),
			dir:   vgeo.DirW,
			moves: 20,
		},
		{xy: vgeo.NewXY(16, 112-vgfx.Epsilon), dir: vgeo.DirN, moves: 24},
		{xy: vgeo.NewXY[float32](16, 16), dir: vgeo.DirE, moves: 24},
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
