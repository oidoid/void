package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgrid"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballs(
	vec *vvec.Vec[entities.BallEnt],
	gam *engine.Engine,
) vgame.Status {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	hitbox := anim.Hitbox
	radius := float32(hitbox.Max.X-hitbox.Min.X) / 2
	diameter := radius * 2
	layer := gam.Layer(gfx.LayerSuperballs)
	sprites := &layer.Sprites
	clip := layer.Clip
	clip.Min.X -= diameter
	clip.Min.Y -= diameter
	tileW := float32(gam.LevelTileW())
	tileH := float32(gam.LevelTileH())
	lb := gam.LevelBounds
	lvl := vgeo.NewBox(
		lb.Min.X+tileW, lb.Min.Y+tileH, lb.Max.X-tileW, lb.Max.Y-tileH,
	)
	ents := vec.Vals()
	moveSuperballs(ents, lvl, radius)
	if gam.HitSuperballs {
		hitSuperballs(ents, &gam.SuperballGrid, diameter)
	}
	loop := vgame.Pause
	// to-do: always collapse into either move or hit to avoid extra pass?
	for i := range ents {
		loop |= ents[i].Draw(sprites, clip)
	}

	return loop
}

func hitSuperballs(
	ents []entities.BallEnt,
	grid *vgrid.Grid,
	diameter float32,
) {
	grid.Clear()
	for i := range ents {
		grid.InsertAt(ents[i].XY, int32(i))
	}
	grid.ForEach(func(l, r int32) {
		ents[l].Hit(&ents[r], diameter)
	})
}

func moveSuperballs(
	ents []entities.BallEnt, lvl vgeo.Box[float32], radius float32,
) {
	for i := range ents {
		ents[i].Move(lvl, radius)
	}
}
