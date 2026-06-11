package ventdata

import (
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtext"
)

type TextEnt struct {
	Text   string
	Layout vtext.TextLayout // nil `Layout.Chars` to force relayout.
	XY     vmath.XY[int16]
	Z      vgfx.Layer
	Trim   vtext.Trim
}
