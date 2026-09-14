package vengine

type Router[Game any] struct {
	Update func(Game) Status
}
