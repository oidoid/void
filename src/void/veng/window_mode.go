package veng

// desired presentation. see Eng.SetWindowMode().
type WindowMode uint8

const (
	Windowed WindowMode = iota
	Fullscreen
	FullscreenPortrait  // fullscreen with a portrait orientation lock.
	FullscreenLandscape // fullscreen with a landscape orientation lock.
)
