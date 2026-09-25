package vengine

type Zoo[Game any] struct {
	updates []func(Game) Status
}

func (this *Zoo[Game]) Register(update func(Game) Status) {
	this.updates = append(this.updates, update)
}

func (this *Zoo[Game]) Update(gam Game) Status {
	var loop Status
	for _, update := range this.updates {
		loop |= update(gam)
	}
	return loop
}
