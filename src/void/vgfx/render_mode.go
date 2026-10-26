package vgfx

import "github.com/oidoid/void/src/void/vgeo"

// controls final coordinate snapping and WebGL antialiasing. float preserves
// fractional positions with antialiasing; pixel snaps to layer pixels without it.
type RenderMode uint8

const (
	RenderModeFloat RenderMode = iota
	RenderModePixel
)

// matches the sprite shader's `floor(x + .5)` in pixel mode.
func (this RenderMode) SnapXY(xy vgeo.XY[float32]) vgeo.XY[float32] {
	if this == RenderModePixel {
		return vgeo.RoundXY(xy)
	}
	return xy
}
