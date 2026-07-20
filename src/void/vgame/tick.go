package vgame

type Tick struct {
	// duration of the previous Go update in milliseconds.
	UpdateMs float64
	// to-do: is this the right place?
	// number of renderer clears completed as of the prior frame.
	DrawCount int32
}
