package veng

type Router[Game any] struct {
	Update func(Game) Status
}
