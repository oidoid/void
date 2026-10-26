package game

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vgrid"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type SuperballEnt struct {
	vgeo.XY[float32]
	Vel    vgeo.XY[float32] // px / sec.
	Rot    float32          // radians.
	RotVel float32          // radians / sec.
}

const (
	superballMaxVel    = float32(120)
	superballMaxRotVel = float32(12)
)

func NewSuperballEnt(rnd func() float32, xy vgeo.XY[float32]) SuperballEnt {
	vel := vgeo.NewXY(
		(rnd()*2-1)*superballMaxVel,
		(rnd()*2-1)*superballMaxVel,
	)
	rotVel := (rnd()*2 - 1) * superballMaxRotVel
	return SuperballEnt{XY: xy, Vel: vel, RotVel: rotVel}
}

func NewSuperballEntFromSpawn(
	rnd func() float32, spawn boards.SuperballSpawn,
) SuperballEnt {
	this := NewSuperballEnt(rnd, spawn.XY)
	this.Vel = spawn.Vel
	this.Rot = spawn.Rot
	return this
}

//go:inline
func (this *SuperballEnt) Move(deltaSec float32, bounds vgeo.Box[float32]) {
	this.Rot += this.RotVel * deltaSec
	this.X += this.Vel.X * deltaSec
	this.Y += this.Vel.Y * deltaSec
	xy := this.XY.Round()
	if xy.X < bounds.Min.X {
		this.X = bounds.Min.X
		this.Vel.X = vmath.Abs(this.Vel.X)
	} else if xy.X > bounds.Max.X {
		this.X = bounds.Max.X
		this.Vel.X = -vmath.Abs(this.Vel.X)
	}
	if xy.Y < bounds.Min.Y {
		this.Y = bounds.Min.Y
		this.Vel.Y = vmath.Abs(this.Vel.Y)
	} else if xy.Y > bounds.Max.Y {
		this.Y = bounds.Max.Y
		this.Vel.Y = -vmath.Abs(this.Vel.Y)
	}
}

// to-do: make all other ents follow Update / Draw / Hit() pattern.
func (this *SuperballEnt) Draw(
	sprs *[]vgfx.Spr,
	clip vgeo.Box[float32],
) veng.Status {
	if clip.HitsXY(this.XY.Round()) {
		spr := vgfx.Spr{
			Tag: tags.SuperballDefault,
			XY:  this.XY,
			Z:   gfx.ZSuperball,
		}
		spr.SetRot(this.Rot)
		*sprs = append(*sprs, spr)
	}
	return veng.Pause // demo doesn't want superballs to require updates.
}

func (this *SuperballEnt) Hit(other *SuperballEnt, diameter float32) bool {
	x, otherX := vmath.Round(this.X), vmath.Round(other.X)
	dx := otherX - x
	if dx < 0 {
		dx = -dx
	}
	dx = diameter - dx
	if dx <= 0 {
		return false
	}
	y, otherY := vmath.Round(this.Y), vmath.Round(other.Y)
	dy := otherY - y
	if dy < 0 {
		dy = -dy
	}
	dy = diameter - dy
	if dy <= 0 {
		return false
	}
	if dx < dy {
		dir := float32(1)
		if otherX < x {
			dir = -1
		}
		this.X = x - dir*dx/2
		other.X = otherX + dir*dx/2
		if dir*(other.Vel.X-this.Vel.X) < 0 {
			this.Vel.X, other.Vel.X = other.Vel.X, this.Vel.X
		}
	} else {
		dir := float32(1)
		if otherY < y {
			dir = -1
		}
		this.Y = y - dir*dy/2
		other.Y = otherY + dir*dy/2
		if dir*(other.Vel.Y-this.Vel.Y) < 0 {
			this.Vel.Y, other.Vel.Y = other.Vel.Y, this.Vel.Y
		}
	}
	return true
}

func UpdateSuperballs(
	vec *vvec.Vec[SuperballEnt],
	gam *Game,
) veng.Status {
	meta := gam.Atlas().Meta[tags.SuperballDefault]
	hitbox := meta.Hitbox
	diameter := float32(hitbox.W())
	layer := gam.Layer(gfx.LayerSuperballs)
	sprs := &layer.Sprs
	clip := layer.Clip
	nearbox := layer.Nearbox()
	// conservative extents for rotation about the sprite center.
	clip.Min.X -= float32(meta.W) + float32(meta.H)/2
	clip.Min.Y -= float32(meta.H) + float32(meta.W)/2
	clip.Max.X += float32(meta.H) / 2
	clip.Max.Y += float32(meta.W) / 2
	tileW := float32(gam.BoardTileW())
	tileH := float32(gam.BoardTileH())
	board := vgeo.NewBox(
		tileW-float32(hitbox.Min.X),
		tileH-float32(hitbox.Min.Y),
		float32(gam.Board().W)-tileW-float32(hitbox.Max.X),
		float32(gam.Board().H)-tileH-float32(hitbox.Max.Y),
	)

	ents := vec.Vals()
	boing := gam.Boing
	moveSuperballs(
		ents,
		gam.BeepSuperballs,
		boing,
		nearbox,
		board,
		float32(gam.DeltaSecs()),
	)
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
	loop := veng.Pause
	// to-do: always collapse into either move or hit to avoid extra pass?
	for i := range ents {
		loop |= ents[i].Draw(sprs, clip)
	}

	return loop
}

func hitSuperballs(
	ents []SuperballEnt,
	grid *vgrid.Grid,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	diameter float32,
) {
	grid.Clear()
	for i := range ents {
		grid.InsertAt(ents[i].XY.Round(), int32(i))
	}
	grid.ForEach(func(l, r int32) bool {
		dx := ents[r].Vel.X - ents[l].Vel.X
		dy := ents[r].Vel.Y - ents[l].Vel.Y
		if !ents[l].Hit(&ents[r], diameter) {
			return false
		}
		if beep && nearbox.HitsXY(ents[l].XY.Round()) {
			boing(dx, dy)
		}
		return true
	})
}

func moveSuperballs(
	ents []SuperballEnt,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	board vgeo.Box[float32],
	deltaSec float32,
) {
	for i := range ents {
		if !beep || !nearbox.HitsXY(ents[i].XY.Round()) {
			ents[i].Move(deltaSec, board)
			continue
		}
		dx, dy := ents[i].Vel.X, ents[i].Vel.Y
		ents[i].Move(deltaSec, board)
		if ents[i].Vel.X != dx || ents[i].Vel.Y != dy {
			boing(dx, dy)
		}
	}
}
