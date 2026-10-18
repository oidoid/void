package game

import (
	"testing"

	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestNewP1EntDefaults(t *testing.T) {
	meta := vatlas.TagMeta{
		WH:      vgeo.NewWH[uint16](8, 13),
		Hurtbox: vgeo.XYWH[uint16](2, 0, 4, 4),
	}
	spawn := boards.P1Spawn{
		Spawn:     vboards.Spawn{WH: vgeo.NewWH[float32](8, 13), Z: gfx.ZP1},
		Clockwise: true,
	}
	atlas := vatlas.Atlas{Meta: []vatlas.TagMeta{meta}}
	ent := NewP1Ent(spawn, &atlas)
	if got, want := ent.WH, vgeo.NewWH[uint16](8, 13); got != want {
		t.Fatalf("WH = %v, want %v", got, want)
	}
	if got, want := ent.Hurtbox, meta.Hurtbox; got != want {
		t.Fatalf("Hurtbox = %v, want %v", got, want)
	}
	if got, want := ent.Dir, vgeo.DirE; got != want {
		t.Fatalf("Dir = %v, want %v", got, want)
	}
	if !ent.Clockwise {
		t.Fatal("Clockwise = false, want true")
	}
	if ent.Z != gfx.ZP1 {
		t.Fatalf("Z = %d, want %d", ent.Z, gfx.ZP1)
	}
}

func TestNewP1Ent(t *testing.T) {
	spawn := boards.P1Spawn{
		Spawn: vboards.Spawn{
			XY:      vgeo.NewXY[float32](1.5, 2.5),
			WH:      vgeo.NewWH[float32](8.5, 13.5),
			Rot:     .5,
			Z:       gfx.ZP1,
			Tag:     1,
			FlipX:   true,
			Stretch: true,
		},
	}
	hurtbox := vgeo.XYWH[uint16](1, 2, 3, 4)
	atlas := vatlas.Atlas{Meta: []vatlas.TagMeta{
		{}, {Hurtbox: hurtbox},
	}}
	ent := NewP1Ent(spawn, &atlas)
	if got, want := ent.Spr, spawn.Spawn.Spr(); got != want {
		t.Errorf("spr = %#v, want %#v", got, want)
	}
	if ent.Hurtbox != hurtbox || ent.Dir != vgeo.DirE || ent.Clockwise {
		t.Errorf("behavior = %#v, want hurtbox %v, east, counterclockwise",
			ent, hurtbox)
	}
}

func TestP1EntTurnsRightAtWalls(t *testing.T) {
	const wallGap = p1MaxMove / 256 // eight collision bisections.
	tiles := make([]vboards.Tile, 64)
	wall := vboards.NewTile(tags.BlockStripesGrey, true)
	for x := range 8 {
		tiles[x] = wall
		tiles[56+x] = wall
	}
	for y := range 8 {
		tiles[y*8] = wall
		tiles[y*8+7] = wall
	}
	board := vboards.Board{
		WH:    vgeo.NewWH[int32](128, 128),
		Tile:  vgeo.NewWH[uint8](16, 16),
		Tiles: tiles,
	}
	ent := P1Ent{
		Anim:      vgfx.Anim{Spr: vgfx.Spr{XY: vgeo.NewXY[float32](32, 32)}},
		Hurtbox:   vgeo.XYWH[uint16](0, 0, 1, 1),
		Dir:       vgeo.DirE,
		Clockwise: true,
	}
	wants := []struct {
		xy    vgeo.XY[float32]
		dir   vgeo.Dir
		moves int
	}{
		{xy: vgeo.NewXY(111-wallGap, 32), dir: vgeo.DirS, moves: 20},
		{
			xy:    vgeo.NewXY(111-wallGap, 111-wallGap),
			dir:   vgeo.DirW,
			moves: 20,
		},
		{xy: vgeo.NewXY(16, 111-wallGap), dir: vgeo.DirN, moves: 24},
		{xy: vgeo.NewXY[float32](16, 16), dir: vgeo.DirE, moves: 24},
	}
	for _, want := range wants {
		for range want.moves {
			ent.Move(.5, &board)
		}
		if ent.XY != want.xy || ent.Dir != want.dir {
			t.Fatalf("P1 = (%v, %v), want (%v, %v)", ent.XY, ent.Dir, want.xy, want.dir)
		}
	}
}

func TestP1EntAnimatesAndDrawsItsDirectionalSprite(t *testing.T) {
	gam := NewGame()
	gam.Eng.SetBoard(&vboards.Board{
		WH: vgeo.NewWH[int32](64, 64), Tile: vgeo.NewWH[uint8](8, 8),
		Tiles: make([]vboards.Tile, 64),
	})
	layer := gam.Layer(gfx.LayerP1)
	layer.Clip = vgeo.XYWH[float32](0, 0, 64, 64)
	ent := NewP1Ent(boards.P1Spawn{Spawn: vboards.Spawn{
		XY: vgeo.NewXY[float32](16, 16), WH: vgeo.NewWH[float32](8, 13),
		Z: gfx.ZP1, Tag: tags.BackpackerWalkRight,
	}}, gam.Atlas())
	for _, test := range []struct {
		dir  vgeo.Dir
		tag  vatlas.Tag
		flip bool
	}{
		{vgeo.DirN, tags.BackpackerWalkUp, false},
		{vgeo.DirE, tags.BackpackerWalkRight, false},
		{vgeo.DirW, tags.BackpackerWalkRight, true},
		{vgeo.DirW, tags.BackpackerWalkRight, true},
		{vgeo.DirS, tags.BackpackerWalkDown, false},
		{vgeo.DirE, tags.BackpackerWalkRight, false},
	} {
		layer.Sprs = layer.Sprs[:0]
		ent.Dir = test.dir
		ent.Update(gam)
		if ent.Tag != test.tag || ent.FlipX() != test.flip {
			t.Fatalf("dir %d: tag %d, flip %v", test.dir, ent.Tag, ent.FlipX())
		}
		if len(layer.Sprs) != 1 || layer.Sprs[0] != ent.Spr {
			t.Fatal("did not draw the entity's animated sprite")
		}
	}
}
