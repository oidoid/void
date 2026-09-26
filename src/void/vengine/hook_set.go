package vengine

type hookSet[Game any] struct {
	hooks []func(Game) Status
}

func (this *hookSet[Game]) Register(hook func(Game) Status) {
	this.hooks = append(this.hooks, hook)
}

func (this *hookSet[Game]) Hook(gam Game) Status {
	var stat Status
	for _, hook := range this.hooks {
		stat |= hook(gam)
	}
	return stat
}
