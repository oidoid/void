package ventities

import "github.com/oidoid/void/src/void/vgame"

type Zoo[Game any] struct {
	updaters []func(Game) vgame.Status
}

func (this *Zoo[Game]) Register(fn func(Game) vgame.Status) {
	this.updaters = append(this.updaters, fn)
}

func (this *Zoo[Game]) Update(gam Game) vgame.Status {
	var loop vgame.Status
	for _, fn := range this.updaters {
		loop |= fn(gam)
	}
	return loop
}
