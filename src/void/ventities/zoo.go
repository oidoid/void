package ventities

import "github.com/oidoid/void/src/void/vtypes"

type Update[Game any] func(Game) vtypes.Status

type Zoo[Game any] struct {
	updates []Update[Game]
}

func (this *Zoo[Game]) Register(update Update[Game]) {
	this.updates = append(this.updates, update)
}

func (this *Zoo[Game]) Update(gam Game) vtypes.Status {
	var loop vtypes.Status
	for _, update := range this.updates {
		loop |= update(gam)
	}
	return loop
}
