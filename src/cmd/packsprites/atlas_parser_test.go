package main

import (
	"bytes"
	"encoding/binary"
	"strings"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestAseFixedRecordSizes(t *testing.T) {
	for _, test := range []struct {
		name string
		data any
		want int
	}{
		{"file header", vatlas.AseHeader{}, 128},
		{"frame header", vatlas.AseFrameHeader{}, 16},
		{"chunk header", vatlas.AseChunkHeader{}, 6},
		{"assetLayer header", vatlas.AseLayerHeader{}, 16},
		{"cel header", vatlas.AseCelHeader{}, 16},
		{"cel image header", vatlas.AseCelImageHeader{}, 4},
		{"tags header", vatlas.AseTagsHeader{}, 10},
		{"tag header", vatlas.AseTagSpanHeader{}, 17},
		{"palette header", vatlas.AsePalHeader{}, 20},
		{"palette entry header", vatlas.AsePalEntryHeader{}, 6},
		{"old palette header", vatlas.AseOldPalHeader{}, 2},
		{"old palette packet header", vatlas.AseOldPalPacketHeader{}, 2},
		{"assetSlice header", vatlas.AseSliceHeader{}, 12},
		{"tilemap cel header", vatlas.AseCelTilemapHeader{}, 32},
		{"assetSlice key header", vatlas.AseKeyHeader{}, 20},
		{"user data header", vatlas.AseUserDataHeader{}, 4},
		{"color", vatlas.AseRGBA{}, 4},
	} {
		if got := binary.Size(test.data); got != test.want {
			t.Errorf("%s is %d bytes, want %d", test.name, got, test.want)
		}
	}
}

func TestNameToIdent(t *testing.T) {
	for _, test := range []struct {
		name string
		want string
	}{
		{"widget-edge-light", "WidgetEdgeLight"},
		{"ui-button", "UIButton"},
		{"--superball--on-", "SuperballOn"},
		{"PalTextLight", "PalTextLight"},
	} {
		if got := nameToIdent(test.name); got != test.want {
			t.Errorf("nameToIdent(%q) = %q, want %q",
				test.name, got, test.want)
		}
	}
}

func TestTagFrameI(t *testing.T) {
	for _, test := range []struct {
		name string
		dir  vatlas.AseDir
		want []int
	}{
		{"forward", vatlas.AseDirForward, []int{2, 3, 4}},
		{"reverse", vatlas.AseDirReverse, []int{4, 3, 2}},
		{"ping pong", vatlas.AseDirPingPong, []int{2, 3, 4, 3}},
		{
			"reverse ping pong",
			vatlas.AseDirPingPongReverse,
			[]int{4, 3, 2, 3},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			tag := assetTagSpan{AseTagSpan: vatlas.AseTagSpan{
				Header: vatlas.AseTagSpanHeader{
					From:      2,
					To:        4,
					Direction: test.dir,
				},
			}}
			if got := framePeriod(tag); got != len(test.want) {
				t.Errorf("framePeriod(_) = %d, want %d", got, len(test.want))
			}
			for i, want := range test.want {
				if got := frameIndex(tag, i); got != want {
					t.Errorf("frameIndex(_, %d) = %d, want %d", i, got, want)
				}
			}
		})
	}
}

func TestBaseColorSlots(t *testing.T) {
	red := vatlas.AseRGBA{R: 255, A: 255}
	green := vatlas.AseRGBA{G: 255, A: 255}
	base := &asset{
		W: 2, H: 1, ColorDepth: vatlas.AseColorIndexed,
		TransparentIndex: 0,
	}
	basePal := make([]vatlas.AseRGBA, 6)
	basePal[3], basePal[5] = red, green
	slots, err := mapBaseColorSlots(stemTag{tag: "Base"}, base, []rawFrame{{
		pxs: []byte{3, 5}, pal: basePal,
	}})
	if err != nil {
		t.Fatal(err)
	}
	source := &asset{
		ColorDepth: vatlas.AseColorIndexed, TransparentIndex: 0,
	}
	sourcePal := make([]vatlas.AseRGBA, 10)
	sourcePal[7], sourcePal[9] = green, red
	frames, err := swapFrames(
		stemTag{tag: "Source"}, source,
		[]rawFrame{{pxs: []byte{9, 7, 0}, pal: sourcePal}}, slots,
	)
	if err != nil {
		t.Fatal(err)
	}
	want := []byte{0, 0, 0, 255, 1, 0, 0, 255, 0, 0, 0, 0}
	if !bytes.Equal(frames[0], want) {
		t.Fatalf("swapped frame = %v, want %v", frames[0], want)
	}
	_, err = mapBaseColorSlots(stemTag{tag: "Base"}, base, []rawFrame{{
		pxs: []byte{3, 5}, pal: []vatlas.AseRGBA{
			{}, {}, {}, red, {}, red,
		},
	}})
	if err == nil || !strings.Contains(err.Error(), "repeats base color") {
		t.Fatalf("duplicate base colors error = %v", err)
	}
}

func TestPlaceCelsDeduplicates(t *testing.T) {
	anims := []swappedAnim{
		{
			Anim:   vatlas.Anim{Cels: 1, W: 1, H: 1},
			frames: []swappedFrame{{1, 2, 3, 4}},
		},
		{
			Anim:   vatlas.Anim{Cels: 1, W: 1, H: 1},
			frames: []swappedFrame{{1, 2, 3, 4}},
		},
		{
			Anim:   vatlas.Anim{Cels: 1, W: 1, H: 1},
			frames: []swappedFrame{{5, 6, 7, 8}},
		},
	}
	_, got, _, err := placeCels(anims)
	if err != nil {
		t.Fatal(err)
	}
	want := []uint16{0, 0, 0, 0, 1, 0}
	if len(got) != len(want) {
		t.Fatalf("cel coordinates = %v, want %v", got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("cel coordinates = %v, want %v", got, want)
		}
	}
}

func TestParseHitboxes(t *testing.T) {
	box := func(x, y int32, w, h uint32) vatlas.AseXYWH {
		return vatlas.AseXYWH{X: x, Y: y, W: w, H: h}
	}
	makeSlice := func(
		tag string,
		rgba vatlas.AseRGBA,
		bounds ...vatlas.AseXYWH,
	) assetSlice {
		keys := make([]vatlas.AseKey, len(bounds))
		for i := range bounds {
			keys[i].Header.Bounds = bounds[i]
		}
		return assetSlice{
			AseSlice: vatlas.AseSlice{Name: tag, Keys: keys},
			RGBA:     rgba,
		}
	}
	red := vatlas.AseRGBA{R: 255, A: 255}
	green := vatlas.AseRGBA{G: 255, A: 255}
	blue := vatlas.AseRGBA{B: 255, A: 255}
	for _, test := range []struct {
		name    string
		slices  []assetSlice
		hit     vgeo.Box[uint16]
		hurt    vgeo.Box[uint16]
		errText string
	}{
		{
			name: "hit and hurt",
			slices: []assetSlice{
				makeSlice("run", red, box(1, 2, 3, 4)),
				makeSlice("run", green, box(5, 6, 7, 8)),
			},
			hit:  vgeo.XYWH[uint16](1, 2, 3, 4),
			hurt: vgeo.XYWH[uint16](5, 6, 7, 8),
		},
		{
			name:   "shared",
			slices: []assetSlice{makeSlice("run", blue, box(1, 2, 3, 4))},
			hit:    vgeo.XYWH[uint16](1, 2, 3, 4),
			hurt:   vgeo.XYWH[uint16](1, 2, 3, 4),
		},
		{
			name:   "different tag",
			slices: []assetSlice{makeSlice("idle", red, box(1, 2, 3, 4))},
		},
		{
			name: "bounds vary",
			slices: []assetSlice{
				makeSlice("run", red, box(1, 2, 3, 4), box(1, 2, 3, 5)),
			},
			errText: "bounds varies",
		},
		{
			name:    "color unsupported",
			slices:  []assetSlice{makeSlice("run", vatlas.AseRGBA{}, box(1, 2, 3, 4))},
			errText: "color unsupported",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			file := &asset{Slices: test.slices}
			hit, hurt, err := parseHitboxes(file, "run")
			if test.errText != "" {
				if err == nil || !strings.Contains(err.Error(), test.errText) {
					t.Fatalf("error = %v, want %q", err, test.errText)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if hit != test.hit || hurt != test.hurt {
				t.Fatalf("hit, hurt = %v, %v; want %v, %v",
					hit, hurt, test.hit, test.hurt)
			}
		})
	}
}

func TestReadAsepriteErrorNamesFile(t *testing.T) {
	path := "../../../go.mod"
	_, err := readAsset(path)
	if err == nil || !strings.Contains(err.Error(), path) {
		t.Fatalf("error = %v, want filename %q", err, path)
	}
}

func TestReadAsepriteFontPaletteData(t *testing.T) {
	font, err := readAsset("../../demo/assets/atlas/mem-prop-5x6.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	if font.Data == nil || font.Data.Pal != "Text" {
		t.Fatalf("asset data = %#v, want pal Text", font.Data)
	}
	pal, err := readAsset("../../demo/assets/atlas/pal.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	img, atlas, keys, err := parseAtlas([]*asset{pal, font})
	if err != nil {
		t.Fatal(err)
	}
	for animI, key := range keys {
		if key.stem != "mem-prop-5x6" {
			continue
		}
		anim := atlas.Anims[animI]
		for celI := 0; celI < int(anim.Cels); celI++ {
			cel := atlas.Cels[(animI*vatlas.CelsPerAnim+celI)*4:]
			for y := range int(anim.H) {
				for x := range int(anim.W) {
					px := img.Pix[(int(cel[1])+y)*img.Stride+(int(cel[0])+x)*4:]
					if px[3] == 0 {
						continue
					}
					if !bytes.Equal(px[:4], []byte{1, 0, 0, 255}) {
						t.Fatalf("glyph pixel = %v, want palette slot 1", px[:4])
					}
					return
				}
			}
		}
	}
	t.Fatal("no opaque font pixels")
}

func TestReadAsepriteSpriteData(t *testing.T) {
	file, err := readAsset("../../demo/assets/atlas/widget.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	if file.Data == nil || file.Data.Pal != "Widget" {
		t.Fatalf("asset data = %#v, want pal Widget", file.Data)
	}
	if len(file.Frames) != 3 || len(file.TagSpans) != 3 {
		t.Fatalf("got %d frames and %d tags, want 3 each", len(file.Frames), len(file.TagSpans))
	}
	if len(file.Frames[0].Pal) == 0 {
		t.Fatal("missing indexed palette")
	}
}

func TestReadAsepritePalettes(t *testing.T) {
	file, err := readAsset("../../demo/assets/atlas/pal.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	if file.Data != nil {
		t.Fatalf("palette data = %#v, want nil", file.Data)
	}
	if len(file.TagSpans) == 0 {
		t.Fatal("missing palette tags")
	}
	for _, tag := range file.TagSpans {
		if tag.Name != "Widget" {
			continue
		}
		frames, err := parseFrames(file, tag)
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("Widget raw: %v", frames[0].pxs)
	}
}

func TestParseAtlasSuperballHitbox(t *testing.T) {
	file, err := readAsset("../../demo/assets/atlas/superball.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	_, atlas, keys, err := parseAtlas([]*asset{file})
	if err != nil {
		t.Fatal(err)
	}
	for i, key := range keys {
		if key.qualifiedTag() != "SuperballDefault" {
			continue
		}
		if got, want := atlas.Anims[i].Hitbox, vgeo.XYWH[uint16](1, 1, 6, 6); got != want {
			t.Fatalf("Superball hitbox = %v, want %v", got, want)
		}
		return
	}
	t.Fatal("missing SuperballDefault")
}
