package main

import (
	"fmt"
	"strings"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vmath"
)

// converts raw Aseprite JSON into an Atlas and the ordered tag names. the
// returned tags slice is parallel to Atlas.Anims.
func parseAtlas(file *vatlas.AseFile) (*vatlas.Atlas, []string, error) {
	// void--Nil is always first at index 0 with a single transparent cel.
	anims := []vatlas.Anim{{Cels: 1}}
	celXY := []uint16{0, 0}
	tags := []string{"void--Nil"}
	seen := map[string]bool{"void--Nil": true}

	for _, span := range file.Meta.FrameTags {
		tag, err := parseTag(span.Name)
		if err != nil {
			return nil, nil, err
		}
		if seen[tag] {
			return nil, nil, fmt.Errorf("atlas tag %q duplicate", tag)
		}
		seen[tag] = true

		frames, err := parseAnimFrames(span, file.Frames)
		if err != nil {
			return nil, nil, err
		}
		anim, err := parseAnim(span.Name, frames, file.Meta.Slices)
		if err != nil {
			return nil, nil, err
		}
		anims = append(anims, anim)
		tags = append(tags, tag)
		for _, frame := range frames {
			xy := parseCel(frame)
			celXY = append(celXY, xy.X, xy.Y)
		}
	}

	for _, slice := range file.Meta.Slices {
		if !seen[slice.Name] {
			return nil, nil, fmt.Errorf("atlas hitbox %q has no animation", slice.Name)
		}
	}

	atlas := vatlas.NewAtlas(anims, celXY)
	return &atlas, tags, nil
}

func intAbs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func parseAnim(
	name string,
	frames []vatlas.AseFrame,
	slices []vatlas.AseSlice,
) (vatlas.Anim, error) {
	if len(frames) == 0 {
		return vatlas.Anim{}, fmt.Errorf("no atlas frame %q", name)
	}
	hitbox, hurtbox, err := parseHitboxes(name, slices)
	if err != nil {
		return vatlas.Anim{}, err
	}
	return vatlas.Anim{
		Cels:    uint8(len(frames)),
		W:       uint16(frames[0].SourceSize.W),
		H:       uint16(frames[0].SourceSize.H),
		Hitbox:  hitbox,
		Hurtbox: hurtbox,
	}, nil
}

// each frame is guaranteed to appear for at least `CelMillis`. cels are
// duplicated until cel duration is at least met; cels are unpacked until a full
// period is defined for the direction. no warns for overflowing past on second
// or uneven periods.
func parseAnimFrames(
	span vatlas.AseTagSpan,
	frameMap map[string]vatlas.AseFrame,
) ([]vatlas.AseFrame, error) {
	var frames []vatlas.AseFrame
	animDuration := 0
	from := int(span.From)
	to := int(span.To)
	frameLen := to - from + 1
	peak := frameLen - 1
	cycle := max(1, 2*peak)

	end := frameLen
	if span.Direction == "pingpong" || span.Direction == "pingpong_reverse" {
		end = cycle
	}

	indexByDir := func(i int) int {
		switch span.Direction {
		case "reverse":
			return to - (i % frameLen)
		case "pingpong":
			return from + peak - intAbs(i%cycle-peak)
		case "pingpong_reverse":
			return to - (peak - intAbs(i%cycle-peak))
		default: // forward
			return from + (i % frameLen)
		}
	}

	for i := 0; i < end &&
		len(frames) < vatlas.CelsPerAnim &&
		animDuration < vatlas.MaxAnimLoopMillis; i++ {
		// `--filename-format='{title}--{tag}--{frame}'`.
		frameTag := fmt.Sprintf("%s--%d", span.Name, indexByDir(i))
		frame, ok := frameMap[frameTag]
		if !ok {
			return nil, fmt.Errorf("no atlas frame %q", frameTag)
		}
		for celDur := 0; celDur < int(frame.Duration) &&
			len(frames) < vatlas.CelsPerAnim &&
			animDuration < vatlas.MaxAnimLoopMillis; celDur += vatlas.CelMillis {
			animDuration += vatlas.CelMillis
			frames = append(frames, frame)
			if from == to {
				return frames, nil // optimize for long single cel
			}
		}
	}
	return frames, nil
}

func parseCel(frame vatlas.AseFrame) vmath.XY[uint16] {
	x := frame.Frame.X + int32((frame.Frame.W-uint32(frame.SourceSize.W))/2)
	y := frame.Frame.Y + int32((frame.Frame.H-uint32(frame.SourceSize.H))/2)
	return vmath.NewXY(uint16(x), uint16(y))
}

func parseHitboxes(
	name string,
	slices []vatlas.AseSlice,
) (vmath.Box[uint16], vmath.Box[uint16], error) {
	var hitbox, hurtbox vmath.Box[uint16]
	for _, slice := range slices {
		if slice.Name != name || len(slice.Keys) == 0 {
			continue
		}
		first := slice.Keys[0].Bounds
		for _, k := range slice.Keys {
			if k.Bounds != first {
				return vmath.Box[uint16]{}, vmath.Box[uint16]{},
					fmt.Errorf(
						"atlas tag %q hitbox bounds varies across frames",
						name,
					)
			}
		}
		red := slice.Color == "#ff0000ff"
		green := slice.Color == "#00ff00ff"
		blue := slice.Color == "#0000ffff"
		if !red && !green && !blue {
			return vmath.Box[uint16]{}, vmath.Box[uint16]{},
				fmt.Errorf(
					"atlas tag %q hitbox color %s unsupported",
					name,
					slice.Color,
				)
		}
		var zero vmath.Box[uint16]
		if hitbox != zero && (red || blue) {
			return zero, zero, fmt.Errorf("atlas tag %q has multiple hitboxes", name)
		}
		if hurtbox != zero && (green || blue) {
			return zero, zero, fmt.Errorf("atlas tag %q has multiple hurtboxes", name)
		}
		box := vmath.XYWH(
			uint16(first.X),
			uint16(first.Y),
			uint16(first.W),
			uint16(first.H),
		)
		if red || blue {
			hitbox = box
		}
		if green || blue {
			hurtbox = box
		}
	}
	return hitbox, hurtbox, nil
}

func parseTag(name string) (string, error) {
	if !strings.Contains(name, "--") {
		return "", fmt.Errorf(
			"atlas tag %q not in <filestem>--<animation> format", name,
		)
	}
	return name, nil
}
