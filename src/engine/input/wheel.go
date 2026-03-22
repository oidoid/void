package input

type WheelEvent struct {
	// horizontal scroll delta in client pixels.
	X float32
	// vertical scroll delta in client pixels.
	Y float32
	// depth scroll delta in client pixels.
	Z float32
}
