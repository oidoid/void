package ventdata

import (
	"github.com/oidoid/void/src/void/vtext"
)

type TextEnt struct {
	Text string
	// nil `Layout.Chars` to force relayout.
	Layout vtext.TextLayout
}
