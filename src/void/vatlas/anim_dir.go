package vatlas

// Animation direction.
type AnimDir uint8

const (
	AnimDirForward AnimDir = iota
	AnimDirReverse
	AnimDirPingPong
	AnimDirPingPongReverse
)
