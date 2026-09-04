package entities

import (
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

type P1Ent struct {
	vgfx.Spr
	Hurtbox   vgeo.Box[uint16]
	Dir       vgeo.Dir
	Clockwise bool
}

const (
	p1Vel     = float32(8)
	p1MaxMove = float32(4)
)

func NewP1Ent(xy vgeo.XY[float32], anim vatlas.Anim) P1Ent {
	return P1Ent{
		Spr: vgfx.Spr{
			XY: xy, WH: vgeo.NewWH(anim.W, anim.H), Z: gfx.ZP1,
		},
		Dir: vgeo.DirE, Hurtbox: anim.Hurtbox, Clockwise: true,
	}
}

func (this *P1Ent) Update(gam game.Game) vgame.Status {
	layer := gam.Layer(this.Z.Layer())
	this.Move(gam.DeltaSecs(), gam.Board())
	if layer.Clip.HitsBox(vgeo.XYWH(
		this.X, this.Y, float32(this.W), float32(this.H),
	)) {
		layer.Sprs = append(layer.Sprs, this.spr())
	}
	return vgame.Pause // demo doesn't want p1 to require updates.
}

func (this *P1Ent) Move(deltaSecs float64, board *vboards.Board) {
	by := min(float32(deltaSecs)*p1Vel, p1MaxMove)
	next := this.XY
	switch this.Dir {
	case vgeo.DirE:
		next.X += by
	case vgeo.DirN:
		next.Y -= by
	case vgeo.DirW:
		next.X -= by
	case vgeo.DirS:
		next.Y += by
	}
	if this.hitsWall(next, board) {
		this.XY = this.moveToWall(next, board)
		this.turn()
		return
	}
	this.XY = next
}

func (this *P1Ent) moveToWall(
	next vgeo.XY[float32],
	board *vboards.Board,
) vgeo.XY[float32] {
	safe, wall := this.XY, next
	for range 8 {
		mid := vgeo.NewXY((safe.X+wall.X)/2, (safe.Y+wall.Y)/2)
		if this.hitsWall(mid, board) {
			wall = mid
		} else {
			safe = mid
		}
	}
	return safe
}

func (this *P1Ent) hitsWall(
	xy vgeo.XY[float32],
	board *vboards.Board,
) bool {
	minX := int32(vmath.Floor(xy.X + float32(this.Hurtbox.Min.X)))
	maxX := int32(vmath.Floor(xy.X + float32(this.Hurtbox.Max.X) - 1))
	minY := int32(vmath.Floor(xy.Y + float32(this.Hurtbox.Min.Y)))
	maxY := int32(vmath.Floor(xy.Y + float32(this.Hurtbox.Max.Y) - 1))
	if minX < 0 || maxX >= board.W || minY < 0 || maxY >= board.H {
		return true
	}
	switch this.Dir {
	case vgeo.DirE, vgeo.DirW:
		tileX := minX
		if this.Dir == vgeo.DirE {
			tileX = maxX
		}
		if board.HitsAt(vgeo.NewXY(tileX, minY)) {
			return true
		}
		return board.HitsAt(vgeo.NewXY(tileX, maxY))
	case vgeo.DirN, vgeo.DirS:
		tileY := minY
		if this.Dir == vgeo.DirS {
			tileY = maxY
		}
		if board.HitsAt(vgeo.NewXY(minX, tileY)) {
			return true
		}
		return board.HitsAt(vgeo.NewXY(maxX, tileY))
	}
	return false
}

func (this *P1Ent) turn() {
	by := vgeo.DirN
	if this.Clockwise {
		by = vgeo.DirS
	}
	this.Dir = (this.Dir + by) % vgeo.DirCenter
}

func (this *P1Ent) spr() vgfx.Spr {
	spr := this.Spr
	switch this.Dir {
	case vgeo.DirN:
		spr.SetTag(tags.BackpackerWalkUp)
	case vgeo.DirW:
		spr.SetFlipX(!spr.FlipX())
	case vgeo.DirS:
		spr.SetTag(tags.BackpackerWalkDown)
	default:
		if spr.Tag() == 0 {
			spr.SetTag(tags.BackpackerWalkRight)
		}
	}
	return spr
}
