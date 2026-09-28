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
	spawn boards.CursorSpawn, atlas *vatlas.Atlas,
) CursorEnt {
	return CursorEnt{CursorEnt: veng.NewCursorEnt(
		spawn.Spawn,
		0,
		float32(spawn.KbdVel),
		atlas.Anims[int(spawn.Tag)].Hitbox,
	)}
}

func (this *CursorEnt) Update(gam *Game) veng.Status {
	return this.CursorEnt.Update(&gam.Eng)
}
