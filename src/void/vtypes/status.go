package vtypes

// whether an update needs a render.
type Status uint8

const (
	Pause Status = iota
	Loop
)
