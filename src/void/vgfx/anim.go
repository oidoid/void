package vgfx

import (
	"math"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtypes"
)

// an animated sprite. playback owns `Cel` and `Tag`.
type Anim struct {
	Spr
	playMillis      uint32
	countdownMillis float64 // time remaining in the current cel.
	step            uint16  // playback period position.
	done            bool
}

func (this *Anim) Done() bool { return this.done }

// changes tags and restarts on the next Update. selecting the same tag
// preserves playback. call this instead of assigning Spr.Tag directly.
func (this *Anim) SetTag(tag vatlas.Tag) {
	if this.Tag != tag {
		this.Tag = tag
		this.Reset()
	}
}

// animates the sprite.
func (this *Anim) Update(
	atlas *vatlas.Atlas, deltaMillis float64,
) vtypes.Status {
	if this.done {
		return vtypes.Pause
	}
	meta := atlas.Meta[this.Tag]
	steps := loopPeriod(meta)
	if this.playMillis == 0 {
		this.Cel = celIndex(meta, 0)
		for step := range steps {
			cel := atlas.Cel(this.Tag, celIndex(meta, step))
			this.playMillis += uint32(cel.Millis)
		}
		this.countdownMillis = float64(atlas.Cel(this.Tag, this.Cel).Millis)
	}
	if meta.Cels == 1 && meta.Repeat == 0 {
		return vtypes.Pause
	}
	this.countdownMillis -= max(0, deltaMillis)
	if this.countdownMillis <= 0 {
		// at most 255 cels * 255 repeats = 65025 playback positions.
		total := uint16(meta.Cels) * uint16(meta.Repeat)
		if meta.Repeat != 0 && meta.Cels > 1 &&
			meta.Dir >= vatlas.AnimDirPingPong {
			total = uint16(meta.Cels) + uint16(meta.Repeat-1)*uint16(meta.Cels-1)
		}
		cycles := math.Floor(-this.countdownMillis / float64(this.playMillis))
		skipped := cycles * float64(steps)
		if total != 0 && float64(this.step)+skipped >= float64(total) {
			this.step = total - 1
			this.Cel, this.done = celIndex(meta, this.step), true
			return vtypes.Pause
		}
		if total != 0 {
			this.step += uint16(skipped)
		}
		this.countdownMillis += cycles * float64(this.playMillis)
		for this.countdownMillis <= 0 {
			if total != 0 && this.step+1 == total {
				this.done = true
				return vtypes.Pause
			}
			this.step++
			if total == 0 && this.step == steps {
				this.step = 0
			}
			this.Cel = celIndex(meta, this.step)
			this.countdownMillis += float64(atlas.Cel(this.Tag, this.Cel).Millis)
		}
	}
	return vtypes.Loop
}

// restarts in the authored direction on the next Update.
func (this *Anim) Reset() { *this = Anim{Spr: this.Spr} }

// number of cel positions in one complete loop.
func loopPeriod(meta vatlas.TagMeta) uint16 {
	if meta.Dir >= vatlas.AnimDirPingPong && meta.Cels > 1 {
		return 2 * uint16(meta.Cels-1)
	}
	return uint16(meta.Cels)
}

// maps a loop position to a cel index.
func celIndex(meta vatlas.TagMeta, step uint16) uint8 {
	if meta.Cels <= 1 {
		return 0
	}
	peak := int32(meta.Cels - 1)
	i := int32(step % loopPeriod(meta))
	switch meta.Dir {
	case vatlas.AnimDirReverse:
		return uint8(peak - i)
	case vatlas.AnimDirPingPong:
		return uint8(peak - vmath.Abs(i-peak))
	case vatlas.AnimDirPingPongReverse:
		return uint8(vmath.Abs(i - peak))
	default:
		return uint8(i)
	}
}
