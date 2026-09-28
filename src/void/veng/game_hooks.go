package veng

// holds app-specific hooks and routes while Eng holds app-independent state.
type GameHooks[Game any] struct {
	preupdaters hookSet[Game]
	router      Router[Game]
	updaters    hookSet[Game]
}

func (this *GameHooks[Game]) RegisterPreupdate(fn func(Game) Status) {
	this.preupdaters.Register(fn)
}

func (this *GameHooks[Game]) RegisterUpdate(fn func(Game) Status) {
	this.updaters.Register(fn)
}

func (this *GameHooks[Game]) Router() *Router[Game] { return &this.router }

func (this *GameHooks[Game]) Preupdate(eng *Eng, gam Game) Status {
	eng.updateLayerScales()
	stat := this.preupdaters.Hook(gam)
	eng.updateLayerClips()
	return stat
}

func (this *GameHooks[Game]) Update(gam Game) Status {
	return this.updaters.Hook(gam)
}
