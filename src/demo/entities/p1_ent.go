package entities

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vlevels"
	"github.com/oidoid/void/src/void/vmath"
)

type P1Ent struct {
	vgeo.XY[float32]
	vgeo.WH[uint16]
	Hurtbox vgeo.Box[uint16]
	Dir     vgeo.Dir
}

const (
	p1Vel     = float32(8. / 1000)
	p1MaxMove = float32(4)
)

func NewP1Ent(xy vgeo.XY[float32], anim vatlas.Anim) P1Ent {
	return P1Ent{
		XY:      xy,
		Dir:     vgeo.DirE,
		WH:      vgeo.WH[uint16]{W: anim.W, H: anim.H},
		Hurtbox: anim.Hurtbox,
	}
}

func (this *P1Ent) Update(
	sprs *[]vgfx.Spr,
	clip vgeo.Box[float32],
	deltaMillis float64,
	lvl *vlevels.Level,
) vgame.Status {
	this.Move(deltaMillis, lvl)
	if clip.HitsXY(this.XY) {
		*sprs = append(*sprs, this.spr())
	}
	return vgame.Pause // demo doesn't want p1 to require updates.
}

func (this *P1Ent) Move(deltaMillis float64, lvl *vlevels.Level) {
	by := min(float32(deltaMillis)*p1Vel, p1MaxMove)
	next := this.XY
	switch this.Dir {
	case vgeo.DirN:
		next.Y -= by
	case vgeo.DirE:
		next.X += by
	case vgeo.DirS:
		next.Y += by
	case vgeo.DirW:
		next.X -= by
	}
	if this.hitsWall(next, lvl) {
		this.XY = this.moveToWall(next, lvl)
		this.turnRight()
		return
	}
	this.XY = next
}

func (this *P1Ent) moveToWall(
	next vgeo.XY[float32],
	lvl *vlevels.Level,
) vgeo.XY[float32] {
	safe, wall := this.XY, next
	for range 8 {
		mid := vgeo.XY[float32]{
			X: (safe.X + wall.X) / 2,
			Y: (safe.Y + wall.Y) / 2,
		}
		if this.hitsWall(mid, lvl) {
			wall = mid
		} else {
			safe = mid
		}
	}
	return safe
}

func (this *P1Ent) hitsWall(
	xy vgeo.XY[float32],
	lvl *vlevels.Level,
) bool {
	minX := int32(vmath.Floor(xy.X + float32(this.Hurtbox.Min.X)))
	maxX := int32(vmath.Floor(xy.X + float32(this.Hurtbox.Max.X) - 1))
	minY := int32(vmath.Floor(xy.Y + float32(this.Hurtbox.Min.Y)))
	maxY := int32(vmath.Floor(xy.Y + float32(this.Hurtbox.Max.Y) - 1))
	if minX < lvl.Min.X || maxX >= lvl.Max.X ||
		minY < lvl.Min.Y || maxY >= lvl.Max.Y {
		return true
	}
	switch this.Dir {
	case vgeo.DirN, vgeo.DirS:
		tileY := minY
		if this.Dir == vgeo.DirS {
			tileY = maxY
		}
		first := lvl.TileAt(vgeo.XY[int32]{X: minX, Y: tileY})
		if first == assets.TileStripesGrey {
			return true
		}
		last := lvl.TileAt(vgeo.XY[int32]{X: maxX, Y: tileY})
		return last == assets.TileStripesGrey
	case vgeo.DirE, vgeo.DirW:
		tileX := minX
		if this.Dir == vgeo.DirE {
			tileX = maxX
		}
		first := lvl.TileAt(vgeo.XY[int32]{X: tileX, Y: minY})
		if first == assets.TileStripesGrey {
			return true
		}
		last := lvl.TileAt(vgeo.XY[int32]{X: tileX, Y: maxY})
		return last == assets.TileStripesGrey
	}
	return false
}

func (this *P1Ent) turnRight() {
	this.Dir = vgeo.Dir((this.Dir + 2) % vgeo.DirCenter)
}

func (this *P1Ent) spr() vgfx.Spr {
	anim := assets.BackpackerWalkRight
	spr := vgfx.Spr{
		AnimCel: anim.Cel(0),
		XY:      this.XY,
		Z:       gfx.ZP1,
		WH:      this.WH,
	}
	switch this.Dir {
	case vgeo.DirN:
		spr.SetAnim(assets.BackpackerWalkUp)
	case vgeo.DirS:
		spr.SetAnim(assets.BackpackerWalkDown)
	case vgeo.DirW:
		spr.SetFlipX(true)
	}
	return spr
}
