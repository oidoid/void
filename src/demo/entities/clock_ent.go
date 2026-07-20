package entities

import (
	"math"

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
	this.Margin = vgeo.Border[int16]{S: 1}
	this.Z = gfx.ZClock
	return this
}

func (this *ClockEnt) Update(
	font *vtext.Font,
	sprites *[]vgfx.Sprite,
	nowMillis float64,
	time vgame.TimeFormat,
	clip vgeo.Box[float32],
	requestUpdateAtMillis func(float64),
) vgame.Status {
	this.SetText(timeString(time))
	this.LayoutChars(font)
	this.TextEnt.XY = this.HUDEnt.XY(
		this.Layout.W, this.Layout.TrimLeadForceH, clip,
	)
	this.TextEnt.Update(font, sprites, clip)
	requestUpdateAtMillis(nowMillis + millisToNextMin(nowMillis))
	return vgame.Pause
}

func millisToNextMin(millis float64) float64 {
	return 60_000 - math.Mod(millis, 60_000)
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
