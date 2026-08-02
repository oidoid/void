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
	sprs := &layer.Sprs
	clip := layer.Clip
	nearbox := layer.Nearbox()
	clip.Min.X -= diameter
	clip.Min.Y -= diameter
	tileW := float32(gam.LevelTileW())
	tileH := float32(gam.LevelTileH())
	lb := gam.LevelBounds
	lvl := vgeo.NewBox(
		lb.Min.X+tileW, lb.Min.Y+tileH, lb.Max.X-tileW, lb.Max.Y-tileH,
	)
	ents := vec.Vals()
	boing := gam.Boing
	moveSuperballs(ents, gam.BeepSuperballs, boing, nearbox, lvl, radius)
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
	ents []entities.BallEnt,
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
		dx := ents[r].D.X - ents[l].D.X
		dy := ents[r].D.Y - ents[l].D.Y
		if !ents[l].Hit(&ents[r], diameter) {
			return false
		}
		boing(dx, dy)
		return true
	})
}

func moveSuperballs(
	ents []entities.BallEnt,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	lvl vgeo.Box[float32],
	radius float32,
) {
	for i := range ents {
		if !beep || !nearbox.HitsXY(ents[i].XY) {
			ents[i].Move(lvl, radius)
			continue
		}
		dx, dy := ents[i].D.X, ents[i].D.Y
		ents[i].Move(lvl, radius)
		if ents[i].D.X != dx || ents[i].D.Y != dy {
			boing(dx, dy)
		}
	}
}
