package game

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/veng"
)

type CursorEnt struct {
	veng.CursorEnt
}

func NewCursorEntFromSpawn(
	spawn boards.InitCursorSpawn, atlas *vatlas.Atlas,
) CursorEnt {
	return CursorEnt{CursorEnt: veng.NewCursorEnt(
		spawn.Spawn,
		0,
		float32(spawn.KbdVel),
		atlas.Anims[int(spawn.Tag)].Hitbox,
	)}
}

func (this *CursorEnt) Update(gam *Game) veng.Status {
	layer := gam.Layer(this.Spr.Z.Layer())
	return this.CursorEnt.Update(
		gam.In(), &layer.Sprs, gam.DeltaSecs(), layer,
	)
}
