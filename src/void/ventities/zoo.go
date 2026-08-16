package ventities

import "github.com/oidoid/void/src/void/vgame"

type Updater[Game any] interface {
	Update(Game) vgame.Status
}

type UpdaterFunc[Game any] func(Game) vgame.Status

func (this UpdaterFunc[Game]) Update(gam Game) vgame.Status {
	return this(gam)
}

type Zoo[Game any] struct {
	updaters []Updater[Game]
}

func (this *Zoo[Game]) Register(updater Updater[Game]) {
	this.updaters = append(this.updaters, updater)
}

func (this *Zoo[Game]) Update(gam Game) vgame.Status {
	var loop vgame.Status
	for _, updater := range this.updaters {
		loop |= updater.Update(gam)
	}
	return loop
}
