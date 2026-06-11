package ventdata

import "github.com/oidoid/void/src/void/vmath"

// to-do: just HUD?
// HUDEnt pins content to a screen edge following the camera.
type HUDEnt struct {
	Anchor vmath.CompassDir
	Margin int16
}
