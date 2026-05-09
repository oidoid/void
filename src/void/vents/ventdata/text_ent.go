package ventdata

import "github.com/oidoid/void/src/void/vmath"

type TextEnt struct {
	vmath.Box[float32]
	Text string
}
