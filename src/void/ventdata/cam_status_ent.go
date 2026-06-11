package ventdata

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vmath"
)

type CamStatusEnt struct {
	HUDEnt
	TextEnt
	BackgroundAnimID vatlas.AnimID
}

func NewCamStatusEnt(backgroundAnimID vatlas.AnimID) CamStatusEnt {
	ent := CamStatusEnt{BackgroundAnimID: backgroundAnimID}
	ent.Anchor = vmath.NE
	ent.Margin = 4
	return ent
}
