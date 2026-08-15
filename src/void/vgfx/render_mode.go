package vgfx

// controls final coordinate snapping and WebGL antialiasing. float preserves
// fractional positions with antialiasing; pixel snaps to layer pixels without it.
type RenderMode uint8

const (
	RenderModeFloat RenderMode = iota
	RenderModePixel
)
