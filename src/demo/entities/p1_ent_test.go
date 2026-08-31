package entities

import (
	"testing"

	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
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

func TestP1EntTurnsRightAtWalls(t *testing.T) {
	const wallGap = p1MaxMove / 256 // eight collision bisections.
	tiles := make([]vlevels.Tile, 64)
	wall := vlevels.NewTile(tags.BlockStripesGrey, true)
	for x := range 8 {
		tiles[x] = wall
		tiles[56+x] = wall
	}
	for y := range 8 {
		tiles[y*8] = wall
		tiles[y*8+7] = wall
	}
	level := vlevels.Level{
		WH:    vgeo.NewWH[int32](128, 128),
		Tile:  vgeo.NewWH[uint8](16, 16),
		Tiles: tiles,
	}
	ent := NewP1Ent(
		vgeo.NewXY[float32](32, 32),
		vatlas.Anim{W: 1, H: 1, Hurtbox: vgeo.XYWH[uint16](0, 0, 1, 1)},
	)
	wants := []struct {
		xy    vgeo.XY[float32]
		dir   vgeo.Dir
		moves int
	}{
		{xy: vgeo.NewXY(112-wallGap, 32), dir: vgeo.DirS, moves: 20},
		{
			xy:    vgeo.NewXY(112-wallGap, 112-wallGap),
			dir:   vgeo.DirW,
			moves: 20,
		},
		{xy: vgeo.NewXY(16, 112-wallGap), dir: vgeo.DirN, moves: 24},
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
