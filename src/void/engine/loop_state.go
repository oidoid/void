package engine

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)
