package vents

import "github.com/oidoid/void/src/void/vgame"

type Zoo[Game vgame.Game] struct {
	updaters []func(Game)
}

func (this *Zoo[Game]) Register(fn func(Game)) {
	this.updaters = append(this.updaters, fn)
}

func (this *Zoo[Game]) Update(gam Game) {
	for _, fn := range this.updaters {
		fn(gam)
	}
}
