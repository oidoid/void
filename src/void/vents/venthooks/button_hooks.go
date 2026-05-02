package venthooks

import "github.com/oidoid/void/src/void/vengine"

func UpdateButtons[Game any](gam *vengine.Engine[Game]) {
	println(gam.CamX())
}
