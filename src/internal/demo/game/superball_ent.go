package game

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vgrid"
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
func (this *SuperballEnt) Move(
	deltaSec float32,
	board vgeo.Box[float32],
	radius float32,
) {
	this.Rot += this.RotVel * deltaSec
	diameter := radius * 2
	this.X += this.Vel.X * deltaSec
	this.Y += this.Vel.Y * deltaSec
	if this.X < board.Min.X {
		this.X = board.Min.X
		this.Vel.X = -this.Vel.X
	} else if this.X+diameter > board.Max.X {
		this.X = board.Max.X - diameter
		this.Vel.X = -this.Vel.X
	}
	if this.Y < board.Min.Y {
		this.Y = board.Min.Y
		this.Vel.Y = -this.Vel.Y
	} else if this.Y+diameter > board.Max.Y {
		this.Y = board.Max.Y - diameter
		this.Vel.Y = -this.Vel.Y
	}
}

// to-do: make all other ents follow Update / Draw / Hit() pattern.
func (this *SuperballEnt) Draw(
	sprs *[]vgfx.Spr,
	clip vgeo.Box[float32],
) veng.Status {
	if clip.HitsXY(this.XY) {
		spr := vgfx.Spr{
			TagCel: tags.SuperballDefault.Cel(0),
			XY:     this.XY,
			Z:      gfx.ZSuperball,
		}
		spr.SetRot(this.Rot)
		*sprs = append(*sprs, spr)
	}
	return veng.Pause // demo doesn't want superballs to require updates.
}

func (this *SuperballEnt) Hit(other *SuperballEnt, diameter float32) bool {
	dx := other.X - this.X
	if dx < 0 {
		dx = -dx
	}
	dx = diameter - dx
	if dx <= 0 {
		return false
	}
	dy := other.Y - this.Y
	if dy < 0 {
		dy = -dy
	}
	dy = diameter - dy
	if dy <= 0 {
		return false
	}
	if dx < dy {
		dir := float32(1)
		if other.X < this.X {
			dir = -1
		}
		this.X -= dir * dx / 2
		other.X += dir * dx / 2
		if dir*(other.Vel.X-this.Vel.X) < 0 {
			this.Vel.X, other.Vel.X = other.Vel.X, this.Vel.X
		}
	} else {
		dir := float32(1)
		if other.Y < this.Y {
			dir = -1
		}
		this.Y -= dir * dy / 2
		other.Y += dir * dy / 2
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
	anim := gam.Atlas().Anims[int(tags.SuperballDefault)]
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
	moveSuperballs(
		ents,
		gam.BeepSuperballs,
		boing,
		nearbox,
		board,
		radius,
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
	ents []SuperballEnt,
	beep bool,
	boing func(float32, float32),
	nearbox vgeo.Box[float32],
	board vgeo.Box[float32],
	radius float32,
	deltaSec float32,
) {
	for i := range ents {
		if !beep || !nearbox.HitsXY(ents[i].XY) {
			ents[i].Move(deltaSec, board, radius)
			continue
		}
		dx, dy := ents[i].Vel.X, ents[i].Vel.Y
		ents[i].Move(deltaSec, board, radius)
		if ents[i].Vel.X != dx || ents[i].Vel.Y != dy {
			boing(dx, dy)
		}
	}
}
