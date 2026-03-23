package input

type WheelPoll struct {
	// horizontal scroll delta in client pixels.
	DeltaX float32
	// vertical scroll delta in client pixels.
	DeltaY float32
	// depth scroll delta in client pixels.
	DeltaZ float32
}
