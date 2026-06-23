package main

import (
	"fmt"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestParseAtlas_empty(t *testing.T) {
	atlas, tags, err := parseAtlas(&vatlas.AseFile{
		Frames: map[string]vatlas.AseFrame{},
		Meta:   vatlas.AseMeta{},
	})
	if err != nil {
		t.Fatal(err)
	}
	// always has void--Nil sentinel.
	if len(atlas.Anims) != 1 {
		t.Fatalf("Anims len: got %d, want 1", len(atlas.Anims))
	}
	if len(tags) != 1 || tags[0] != "void--Nil" {
		t.Fatalf("tags: got %v", tags)
	}
	if len(atlas.Cels) != vatlas.CelsPerAnim*4 {
		t.Fatalf("Cels len: got %d, want %d", len(atlas.Cels), vatlas.CelsPerAnim*4)
	}
}

func TestParseAtlas_errorDuplicateTag(t *testing.T) {
	frame := newAseFrame(vatlas.CelMillis, 0, 0, 1, 1, 1, 1)
	file := &vatlas.AseFile{
		Frames: map[string]vatlas.AseFrame{
			"a--Walk--0": frame,
		},
		Meta: vatlas.AseMeta{
			FrameTags: []vatlas.AseTagSpan{
				newAseTagSpan("a--Walk", 0, 0, "forward"),
				newAseTagSpan("a--Walk", 0, 0, "forward"),
			},
		},
	}
	_, _, err := parseAtlas(file)
	if err == nil {
		t.Fatal("got nil, want error for duplicate tag")
	}
}

func TestParseAtlas_errorTagMissingDoubleDash(t *testing.T) {
	frame := newAseFrame(vatlas.CelMillis, 0, 0, 1, 1, 1, 1)
	file := &vatlas.AseFile{
		Frames: map[string]vatlas.AseFrame{"aWalk--0": frame},
		Meta: vatlas.AseMeta{
			FrameTags: []vatlas.AseTagSpan{newAseTagSpan("aWalk", 0, 0, "forward")},
		},
	}
	_, _, err := parseAtlas(file)
	if err == nil {
		t.Fatal("got nil, want error for tag without --")
	}
}

func TestParseAtlas_errorHitboxWithNoAnim(t *testing.T) {
	file := &vatlas.AseFile{
		Frames: map[string]vatlas.AseFrame{},
		Meta: vatlas.AseMeta{
			Slices: []vatlas.AseSlice{
				newAseSlice("orphan--A", "#ff0000ff", 0, 0, 4, 4),
			},
		},
	}
	_, _, err := parseAtlas(file)
	if err == nil {
		t.Fatal("got nil, want error for hitbox with no animation")
	}
}

func TestParseAtlas_singleAnim(t *testing.T) {
	frame := newAseFrame(vatlas.CelMillis, 10, 20, 8, 8, 8, 8)
	file := &vatlas.AseFile{
		Frames: map[string]vatlas.AseFrame{"a--Walk--0": frame},
		Meta: vatlas.AseMeta{
			FrameTags: []vatlas.AseTagSpan{newAseTagSpan("a--Walk", 0, 0, "forward")},
		},
	}
	atlas, tags, err := parseAtlas(file)
	if err != nil {
		t.Fatal(err)
	}
	if len(atlas.Anims) != 2 {
		t.Fatalf("Anims len: got %d, want 2", len(atlas.Anims))
	}
	if tags[1] != "a--Walk" {
		t.Fatalf("tag[1]: got %q, want %q", tags[1], "a--Walk")
	}
	anim := atlas.Anims[1]
	if anim.W != 8 || anim.H != 8 || anim.Cels != 1 {
		t.Fatalf("anim: got %+v", anim)
	}
	const idx = vatlas.CelsPerAnim * 4
	if atlas.Cels[idx] != 10 || atlas.Cels[idx+1] != 20 {
		t.Fatalf(
			"Cels[%d:%d]: got %v %v, want 10 20",
			idx,
			idx+1,
			atlas.Cels[idx],
			atlas.Cels[idx+1],
		)
	}
}

func TestParseAnimFrames_singleCel(t *testing.T) {
	// a single cel with duration exactly CelMillis plays once.
	frame := newAseFrame(uint16(vatlas.CelMillis), 0, 0, 1, 1, 1, 1)
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 0, "forward"),
		[]vatlas.AseFrame{frame},
		[]int{0},
		"single cel",
	)
}

func TestParseAnimFrames_singleCelLongDuration(t *testing.T) {
	// a single cel with a very long duration is optimized to just one cel entry.
	frame := newAseFrame(65535, 0, 0, 1, 1, 1, 1)
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 0, "forward"),
		[]vatlas.AseFrame{frame},
		[]int{0},
		"single cel long duration",
	)
}

func TestParseAnimFrames_fullAnimForward(t *testing.T) {
	// 4 frames each exactly CelMillis: forward order 0, 1, 2, 3.
	duration := uint16(vatlas.CelMillis)
	frames := []vatlas.AseFrame{
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 3, "forward"),
		frames,
		[]int{0, 1, 2, 3},
		"forward 4 frames",
	)
}

func TestParseAnimFrames_fullAnimReverse(t *testing.T) {
	duration := uint16(vatlas.CelMillis)
	frames := []vatlas.AseFrame{
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 3, "reverse"),
		frames,
		[]int{3, 2, 1, 0},
		"reverse 4 frames",
	)
}

func TestParseAnimFrames_fullAnimPingPong(t *testing.T) {
	// pingpong 3 frames: 0, 1, 2, 1 (peak=2, cycle=4).
	duration := uint16(vatlas.CelMillis)
	frames := []vatlas.AseFrame{
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 2, "pingpong"),
		frames,
		[]int{0, 1, 2, 1},
		"pingpong 3 frames",
	)
}

func TestParseAnimFrames_fullAnimPingPongReverse(t *testing.T) {
	// pingpong_reverse 3 frames: 2, 1, 0, 1 (starts from end)
	duration := uint16(vatlas.CelMillis)
	frames := []vatlas.AseFrame{
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 2, "pingpong_reverse"),
		frames,
		[]int{2, 1, 0, 1},
		"pingpong_reverse 3 frames",
	)
}

func TestParseAnimFrames_multiCelDuration(t *testing.T) {
	// duration of 2*CelMillis means each source frame fills two cel slots.
	duration := uint16(2 * vatlas.CelMillis)
	frames := []vatlas.AseFrame{
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
		newAseFrame(duration, 0, 0, 1, 1, 1, 1),
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, 1, "forward"),
		frames,
		[]int{0, 0, 1, 1},
		"2x duration duplicates each cel",
	)
}

func TestParseAnimFrames_shortAnimCapped(t *testing.T) {
	// more frames than AnimCels: capped at AnimCels.
	duration := uint16(vatlas.CelMillis)
	frames := make([]vatlas.AseFrame, vatlas.CelsPerAnim+4)
	expected := make([]int, vatlas.CelsPerAnim)
	for i := range frames {
		frames[i] = newAseFrame(duration, 0, 0, 1, 1, 1, 1)
	}
	for i := range expected {
		expected[i] = i
	}
	assertFrameIndices(t,
		newAseTagSpan("a--Walk", 0, uint16(len(frames)-1), "forward"),
		frames,
		expected,
		"capped at AnimCels",
	)
}

func TestParseAnimFrames_errorMissingFrame(t *testing.T) {
	frames := map[string]vatlas.AseFrame{} // empty, no frames
	_, err := parseAnimFrames(newAseTagSpan("a--Walk", 0, 0, "forward"), frames)
	if err == nil {
		t.Fatal("got nil, want error for missing frame")
	}
}

func TestParseCel_identity(t *testing.T) {
	// frame and source sizes equal, no padding.
	frame := newAseFrame(1, 10, 20, 16, 16, 16, 16)
	xy := parseCel(frame)
	if xy.X != 10 || xy.Y != 20 {
		t.Fatalf("got (%d,%d), want (10,20)", xy.X, xy.Y)
	}
}

func TestParseCel_withPadding(t *testing.T) {
	// 18x18 frame, source is 16x16.
	frame := newAseFrame(1, 100, 200, 18, 18, 16, 16)
	xy := parseCel(frame)
	if xy.X != 101 || xy.Y != 201 {
		t.Fatalf("got (%d,%d), want (101,201)", xy.X, xy.Y)
	}
}

func TestParseHitboxes_hitboxOnly(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#ff0000ff", 1, 2, 3, 4),
	})
	if err != nil {
		t.Fatal(err)
	}
	if hit != vgeo.XYWH[uint16](1, 2, 3, 4) {
		t.Fatalf("got hitbox %v", hit)
	}
	var zero vgeo.Box[uint16]
	if hurt != zero {
		t.Fatalf("got hurtbox %v, want zero", hurt)
	}
}

func TestParseHitboxes_hurtboxOnly(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#00ff00ff", 5, 6, 7, 8),
	})
	if err != nil {
		t.Fatal(err)
	}
	var zero vgeo.Box[uint16]
	if hit != zero {
		t.Fatalf("got hitbox %v, want zero", hit)
	}
	if hurt != vgeo.XYWH[uint16](5, 6, 7, 8) {
		t.Fatalf("got hurtbox %v", hurt)
	}
}

func TestParseHitboxes_blueIsBoth(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#0000ffff", 1, 2, 3, 4),
	})
	if err != nil {
		t.Fatal(err)
	}
	want := vgeo.XYWH[uint16](1, 2, 3, 4)
	if hit != want {
		t.Fatalf("got hitbox %v, want %v", hit, want)
	}
	if hurt != want {
		t.Fatalf("got hurtbox %v, want %v", hurt, want)
	}
}

func TestParseHitboxes_hitboxAndHurtboxSeparate(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#ff0000ff", 1, 2, 3, 4),
		newAseSlice("tag--A", "#00ff00ff", 5, 6, 7, 8),
	})
	if err != nil {
		t.Fatal(err)
	}
	if hit != vgeo.XYWH[uint16](1, 2, 3, 4) {
		t.Fatalf("got hitbox %v", hit)
	}
	if hurt != vgeo.XYWH[uint16](5, 6, 7, 8) {
		t.Fatalf("got hurtbox %v", hurt)
	}
}

func TestParseHitboxes_filtersUnrelatedTags(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--B", "#ff0000ff", 9, 9, 9, 9),
	})
	if err != nil {
		t.Fatal(err)
	}
	var zero vgeo.Box[uint16]
	if hit != zero || hurt != zero {
		t.Fatalf("got %v/%v, want zero/zero for unrelated tag", hit, hurt)
	}
}

func TestParseHitboxes_errorVaryingBounds(t *testing.T) {
	slice := vatlas.AseSlice{
		Name:  "tag--A",
		Color: "#ff0000ff",
		Keys: []vatlas.AseKey{
			{Bounds: vatlas.AseXYWH{X: 0, Y: 0, W: 4, H: 4}},
			{Bounds: vatlas.AseXYWH{X: 1, Y: 0, W: 4, H: 4}},
		},
	}
	_, _, err := parseHitboxes("tag--A", []vatlas.AseSlice{slice})
	if err == nil {
		t.Fatal("got nil, want error for varying bounds")
	}
}

func TestParseHitboxes_errorUnsupportedColor(t *testing.T) {
	_, _, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#deadbeef", 0, 0, 4, 4),
	})
	if err == nil {
		t.Fatal("got nil, want error for unsupported color")
	}
}

func TestParseHitboxes_errorMultipleHitboxes(t *testing.T) {
	_, _, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#ff0000ff", 0, 0, 4, 4),
		newAseSlice("tag--A", "#ff0000ff", 1, 0, 4, 4),
	})
	if err == nil {
		t.Fatal("got nil, want error for multiple hitboxes")
	}
}

func TestParseHitboxes_errorMultipleHurtboxes(t *testing.T) {
	_, _, err := parseHitboxes("tag--A", []vatlas.AseSlice{
		newAseSlice("tag--A", "#00ff00ff", 0, 0, 4, 4),
		newAseSlice("tag--A", "#00ff00ff", 1, 0, 4, 4),
	})
	if err == nil {
		t.Fatal("got nil, want error for multiple hurtboxes")
	}
}

func TestParseHitboxes_zeroForNoSlices(t *testing.T) {
	hit, hurt, err := parseHitboxes("tag--A", nil)
	var zero vgeo.Box[uint16]
	if err != nil || hit != zero || hurt != zero {
		t.Fatalf("got %v/%v/%v, want zero/zero/nil", err, hit, hurt)
	}
}

// checks that `parseAnimFrames()` returns cels whose positions in the map match
// expected (position in the frames slice passed in).
func assertFrameIndices(
	t *testing.T,
	span vatlas.AseTagSpan,
	frames []vatlas.AseFrame,
	expected []int,
	msg string,
) {
	t.Helper()
	frameMap := map[string]vatlas.AseFrame{}
	for i, frame := range frames {
		frameMap[fmt.Sprintf("%s--%d", span.Name, int(span.From)+i)] = frame
	}
	got, err := parseAnimFrames(span, frameMap)
	if err != nil {
		t.Fatalf("%s: unwant error: %v", msg, err)
	}
	if len(got) != len(expected) {
		t.Fatalf("%s: got %d cels, want %d", msg, len(got), len(expected))
	}
	for celIdx, frameIdx := range expected {
		want := frames[frameIdx]
		if got[celIdx] != want {
			t.Fatalf(
				"%s: cel[%d] got frame[%v], want frame[%d]",
				msg,
				celIdx,
				got[celIdx],
				frameIdx,
			)
		}
	}
}

func newAseFrame(
	duration uint16,
	x, y int32,
	w, h uint32,
	sW, sH uint32,
) vatlas.AseFrame {
	return vatlas.AseFrame{
		Duration:         duration,
		Frame:            vatlas.AseXYWH{X: x, Y: y, W: w, H: h},
		SpriteSourceSize: vatlas.AseXYWH{W: sW, H: sH},
		SourceSize:       vatlas.AseWH{W: uint16(sW), H: uint16(sH)},
	}
}

func newAseSlice(name, color string, x, y int32, w, h uint32) vatlas.AseSlice {
	return vatlas.AseSlice{
		Name:  name,
		Color: color,
		Keys:  []vatlas.AseKey{{Bounds: vatlas.AseXYWH{X: x, Y: y, W: w, H: h}}},
	}
}

func newAseTagSpan(
	name string,
	from, to uint16,
	dir vatlas.AseDir,
) vatlas.AseTagSpan {
	return vatlas.AseTagSpan{Name: name, From: from, To: to, Direction: dir}
}
