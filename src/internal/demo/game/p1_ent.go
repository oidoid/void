package game

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

type P1Ent struct {
	vgfx.Anim
	Hurtbox   vgeo.Box[uint16]
	Dir       vgeo.Dir
	Clockwise bool
}

const (
	p1Vel     = float32(8)
	p1MaxMove = float32(4)
)

func NewP1Ent(spawn boards.P1Spawn, atlas *vatlas.Atlas) P1Ent {
	return P1Ent{
		Anim:      vgfx.Anim{Spr: spawn.Spawn.Spr()},
		Hurtbox:   atlas.Meta[spawn.Tag].Hurtbox,
		Dir:       vgeo.DirE,
		Clockwise: spawn.Clockwise,
	}
}

func (this *P1Ent) Update(gam *Game) veng.Status {
	this.Move(gam.DeltaSecs(), gam.Board())
	tag := tags.BackpackerWalkRight
	switch this.Dir {
	case vgeo.DirN:
		tag = tags.BackpackerWalkUp
	case vgeo.DirS:
		tag = tags.BackpackerWalkDown
	}
	this.SetTag(tag)
	this.SetFlipX(this.Dir == vgeo.DirW)
	this.Anim.Update(gam.Atlas(), gam.DeltaMs())
	layer := gam.Layer(this.Z.Layer())
	xy := vgeo.RoundXY(this.XY)
	if layer.Clip.HitsBox(vgeo.XYWH(
		xy.X, xy.Y, float32(this.W), float32(this.H),
	)) {
		layer.Sprs = append(layer.Sprs, this.Spr)
	}
	return veng.Pause // demo doesn't want p1 to require updates.
}

func (this *P1Ent) Move(deltaSecs float64, board *vboards.Board) {
	by := min(float32(deltaSecs)*p1Vel, p1MaxMove)
	move := vgeo.NewXY[float32](0, 0)
	switch this.Dir {
	case vgeo.DirE:
		move.X = by
	case vgeo.DirN:
		move.Y = -by
	case vgeo.DirW:
		move.X = -by
	case vgeo.DirS:
		move.Y = by
	}
	next := this.XY.Add(move)
	if this.hitsWall(next, board) {
		this.XY = this.moveToWall(next, board)
		this.turn()
		return
	}
	this.XY = next
}

func (this *P1Ent) moveToWall(
	next vgeo.XY[float32], board *vboards.Board,
) vgeo.XY[float32] {
	safe, wall := this.XY, next
	for range 8 {
		mid := safe.Add(wall).Div(2)
		if this.hitsWall(mid, board) {
			wall = mid
		} else {
			safe = mid
		}
	}
	return safe
}

func (this *P1Ent) hitsWall(
	xy vgeo.XY[float32], board *vboards.Board,
) bool {
	box := this.Hurtbox.Cast[float32]()
	box.MoveTo(vgeo.RoundXY(xy))
	return board.HitsBox(box)
}

func (this *P1Ent) turn() {
	by := vgeo.DirN
	if this.Clockwise {
		by = vgeo.DirS
	}
	this.Dir = (this.Dir + by) % vgeo.DirCenter
}
