package entities

import (
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

type ClockEnt struct {
	ventities.HUDEnt
	ventities.TextEnt
}

func NewClockEnt() ClockEnt {
	this := ClockEnt{}
	this.Anchor = vgeo.DirS
	this.Margin = vgeo.Edge[int16]{S: 2}
	this.Z = gfx.ZUIText
	this.SetScale(2)
	return this
}

func (this *ClockEnt) Update(
	font *vtext.Font,
	sprs *[]vgfx.Spr,
	utcMillis uint64,
	time vgame.TimeFormat,
	clip vgeo.Box[float32],
	requestUpdateInMillis func(uint64),
) vgame.Status {
	this.SetText(timeString(time))
	this.LayoutChars(font)
	this.TextEnt.XY = this.HUDEnt.XY(
		this.Layout.W, this.Layout.TrimLeadForceH, clip,
	)
	this.TextEnt.Update(font, sprs, clip)
	requestUpdateInMillis(millisToNextMin(utcMillis))
	return vgame.Pause
}

func millisToNextMin(millis uint64) uint64 {
	return 60_000 - millis%60_000
}

func timeString(time vgame.TimeFormat) string {
	hour := int(time.Hour) % 12
	if hour == 0 {
		hour = 12
	}
	minute := int(time.Minute)
	second := int(time.Second)
	return vtext.Itoa(hour) + ":" +
		vtext.PadInt(minute, 2, "0") + ":" +
		vtext.PadInt(second, 2, "0")
}
