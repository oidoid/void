package vatlas

// animation direction.
type AnimDir uint8

const (
	AnimDirForward AnimDir = iota
	AnimDirReverse
	AnimDirPingPong
	AnimDirPingPongReverse
)
