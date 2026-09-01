package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgrid"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballs(
	vec *vvec.Vec[entities.SuperballEnt],
	gam *engine.Engine,
) vgame.Status {
	anim := gam.Atlas.Anims[int(tags.SuperballDefault)]
	hitbox := anim.Hitbox
	radius := float32(hitbox.Max.X-hitbox.Min.X) / 2
	diameter := radius * 2
	layer := gam.Layer(gfx.LayerSuperballs)
	sprs := &layer.Sprs
	clip := layer.Clip
	nearbox := layer.Nearbox()
	clip.Min.X -= diameter
	clip.Min.Y -= diameter
	tileW := float32(gam.BoardTileW())
	tileH := float32(gam.BoardTileH())
	board := vgeo.NewBox(
		tileW,
		tileH,
		float32(gam.Board().W)-tileW,
		float32(gam.Board().H)-tileH,
	)

	ents := vec.Vals()
	boing := gam.Boing
	moveSuperballs(ents, gam.BeepSuperballs, boing, nearbox, board, radius)
	if gam.HitSuperballs {
		hitSuperballs(
			ents,
			&gam.SuperballGrid,
			gam.BeepSuperballs,
			boing,
			nearbox,
			diameter,
		)
	}
	loop := vgame.Pause
	// to-do: always collapse into either move or hit to avoid extra pass?
	for i := range ents {
		loop |= ents[i].Draw(sprs, clip)
	}

	return loop
}

func hitSuperballs(
	ents []entities.SuperballEnt,
	grid *vgrid.Grid,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	diameter float32,
) {
	grid.Clear()
	for i := range ents {
		grid.InsertAt(ents[i].XY, int32(i))
	}
	grid.ForEach(func(l, r int32) bool {
		if !beep || !nearbox.HitsXY(ents[l].XY) {
			return ents[l].Hit(&ents[r], diameter)
		}
		dx := ents[r].Vel.X - ents[l].Vel.X
		dy := ents[r].Vel.Y - ents[l].Vel.Y
		if !ents[l].Hit(&ents[r], diameter) {
			return false
		}
		boing(dx, dy)
		return true
	})
}

func moveSuperballs(
	ents []entities.SuperballEnt,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	board vgeo.Box[float32],
	radius float32,
) {
	for i := range ents {
		if !beep || !nearbox.HitsXY(ents[i].XY) {
			ents[i].Move(board, radius)
			continue
		}
		dx, dy := ents[i].Vel.X, ents[i].Vel.Y
		ents[i].Move(board, radius)
		if ents[i].Vel.X != dx || ents[i].Vel.Y != dy {
			boing(dx, dy)
		}
	}
}
