package vin

import "github.com/oidoid/void/src/void/vgeo"

type Pinch struct {
	// phy space between active pointers.
	SpanPhy vgeo.XY[float32]
	// phy center of active contacts.
	CenterPhy vgeo.XY[float32]
	// physical change in active pointers' bounding span since the last update.
	DeltaPhy vgeo.XY[float32]
	// physical change in active pointers' bounding-box center since the last
	// update.
	DeltaCenterPhy vgeo.XY[float32]

	prevSpanPhy   vgeo.XY[float32]
	prevCenterPhy vgeo.XY[float32]
}
