package ventities

import "github.com/oidoid/void/src/void/vtypes"

type Updater[Game any] interface {
	Update(Game) vtypes.Status
}

type UpdaterFunc[Game any] func(Game) vtypes.Status

func (this UpdaterFunc[Game]) Update(gam Game) vtypes.Status {
	return this(gam)
}

type Zoo[Game any] struct {
	updaters []Updater[Game]
}

func (this *Zoo[Game]) Register(updater Updater[Game]) {
	this.updaters = append(this.updaters, updater)
}

func (this *Zoo[Game]) Update(gam Game) vtypes.Status {
	var loop vtypes.Status
	for _, updater := range this.updaters {
		loop |= updater.Update(gam)
	}
	return loop
}
