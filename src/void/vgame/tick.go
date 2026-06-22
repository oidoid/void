package vgame

type Tick struct {
	// duration of the previous Go update in milliseconds.
	DeltaMs float64
	// duration of the previous GPU draw call in milliseconds.
	DrawMs float64
}
