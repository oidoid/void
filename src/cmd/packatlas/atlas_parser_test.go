package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"strconv"
	"strings"
	"testing"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
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
		{"tileset header", vatlas.AseTilesetHeader{}, 32},
		{"external tileset", vatlas.AseTilesetExternal{}, 8},
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

func TestParseFramesKeepsCels(t *testing.T) {
	// duration, direction, and repeat do not duplicate, omit, or reorder cels.
	for _, dir := range []vatlas.AnimDir{
		vatlas.AnimDirForward, vatlas.AnimDirReverse,
		vatlas.AnimDirPingPong, vatlas.AnimDirPingPongReverse,
	} {
		file := &asset{
			W: 1, H: 1, ColorDepth: vatlas.AseColorRGBA,
			Frames: make([]assetFrame, 255),
			Layers: []assetLayer{{AseLayer: vatlas.AseLayer{
				Header: vatlas.AseLayerHeader{Flags: 1, Opacity: 255},
			}}},
		}
		for i := range file.Frames {
			file.Frames[i] = assetFrame{Millis: uint16(i * 100), Cels: map[uint16]assetCel{
				0: {LinkedFrame: -1, AseCel: vatlas.AseCel{
					Header: vatlas.AseCelHeader{Opacity: 255},
					Image:  vatlas.AseCelImageHeader{W: 1, H: 1},
					Pxs:    []byte{byte(i), byte(i >> 8), 0, 255},
				}},
			}}
		}
		span := assetTagSpan{AseTagSpan: vatlas.AseTagSpan{
			Header: vatlas.AseTagSpanHeader{To: 254, Direction: dir, Repeat: 3},
		}}
		frames, err := parseFrames(file, span)
		if err != nil {
			t.Fatal(err)
		}
		if len(frames) != 255 {
			t.Fatalf("frame count = %d, want 255", len(frames))
		}
		for i, frame := range frames {
			if !bytes.Equal(frame.pxs, []byte{byte(i), byte(i >> 8), 0, 255}) {
				t.Fatalf("direction %d frame %d = %v", dir, i, frame.pxs)
			}
		}
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
			meta:   vatlas.TagMeta{Cels: 1, WH: vgeo.NewWH[uint16](1, 1)},
			frames: []swappedFrame{{1, 2, 3, 4}},
		},
		{
			meta:   vatlas.TagMeta{Cels: 1, WH: vgeo.NewWH[uint16](1, 1)},
			frames: []swappedFrame{{1, 2, 3, 4}},
		},
		{
			meta:   vatlas.TagMeta{Cels: 1, WH: vgeo.NewWH[uint16](1, 1)},
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

func TestParseAtlasNativeTiles(t *testing.T) {
	red := vatlas.AseRGBA{R: 255, A: 255}
	green := vatlas.AseRGBA{G: 255, A: 255}
	file := &asset{
		name:             "some/path/tile.aseprite",
		ColorDepth:       vatlas.AseColorIndexed,
		TransparentIndex: 0,
		Frames:           []assetFrame{{Pal: []vatlas.AseRGBA{{}, red, green}}},
		Tilesets: []vatlas.AseTileset{{
			Header: vatlas.AseTilesetHeader{
				Flags: vatlas.AseTilesetEmbeddedMask <<
					vatlas.AseTilesetEmbeddedShift,
				Count: 3, W: 1, H: 1,
			},
			Name: "ignored-base", Pxs: []byte{0, 1, 2},
		}},
	}
	img, atlas, keys, err := parseAtlas([]*asset{file})
	if err != nil {
		t.Fatal(err)
	}
	if len(atlas.Meta) != 4 || len(keys) != 1 {
		t.Fatalf("got %d anims and %d keys, want 4 and 1",
			len(atlas.Meta), len(keys))
	}
	decoded := vatlas.DecodeAtlas(vatlas.EncodeAtlas(atlas))
	for i, cel := range decoded.Cels {
		if cel.Millis != 1 {
			t.Errorf("generated cel %d duration = %d, want 1 ms", i, cel.Millis)
		}
	}
	for tileID := range 3 {
		tag := tileID + len(keys)
		if meta := atlas.Meta[tag]; meta.Cels != 1 || meta.W != 1 || meta.H != 1 {
			t.Errorf("tile %d meta = %#v", tileID, meta)
		}
	}
	for tag, want := range []vatlas.AseRGBA{{}, red, green} {
		cel := atlas.Cel(vatlas.Tag(tag+1), 0)
		px := img.Pix[int(cel.Y)*img.Stride+int(cel.X)*4:]
		if got := (vatlas.AseRGBA{R: px[0], G: px[1], B: px[2], A: px[3]}); got != want {
			t.Errorf("tile %d pixel = %#v, want %#v", tag, got, want)
		}
	}
}

func TestParseAtlasRejectsTooManyNativeTiles(t *testing.T) {
	file := &asset{
		name: "tiles.aseprite", W: 1, H: 1,
		ColorDepth: vatlas.AseColorIndexed,
		Tilesets: []vatlas.AseTileset{{
			Header: vatlas.AseTilesetHeader{
				Flags: vatlas.AseTilesetEmbeddedMask <<
					vatlas.AseTilesetEmbeddedShift,
				Count: vatlas.MaxTags, W: 1, H: 1,
			},
			Pxs: make([]byte, vatlas.MaxTags),
		}},
	}
	_, _, _, err := parseAtlas([]*asset{file})
	if err == nil || !strings.Contains(err.Error(), "tag count") {
		t.Fatalf("err = %v, want tag-count overflow", err)
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
			name:   "one pixel",
			slices: []assetSlice{makeSlice("run", blue, box(2, 3, 1, 1))},
			hit:    vgeo.XYWH[uint16](2, 3, 1, 1),
			hurt:   vgeo.XYWH[uint16](2, 3, 1, 1),
		},
		{
			name:   "zero width",
			slices: []assetSlice{makeSlice("run", green, box(4, 5, 0, 1))},
		},
		{
			name:   "zero height",
			slices: []assetSlice{makeSlice("run", red, box(4, 5, 1, 0))},
		},
		{
			name:   "empty shared",
			slices: []assetSlice{makeSlice("run", blue, box(4, 5, 0, 0))},
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
			hit, hurt, err := parseBoxes(file, "run")
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
	font, err := readAsset("../../internal/demo/assets/atlas/mem-prop-5x6.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	if font.Data == nil || font.Data.Pal != "Text" {
		t.Fatalf("asset data = %#v, want pal Text", font.Data)
	}
	pal, err := readAsset("../../internal/demo/assets/atlas/pal.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	img, atlas, keys, err := parseAtlas([]*asset{pal, font})
	if err != nil {
		t.Fatal(err)
	}
	for tag, key := range keys {
		if key.stem != "mem-prop-5x6" {
			continue
		}
		meta := atlas.Meta[tag]
		for celI := 0; celI < int(meta.Cels); celI++ {
			cel := atlas.Cel(vatlas.Tag(tag), uint8(celI))
			for y := range int(meta.H) {
				for x := range int(meta.W) {
					px := img.Pix[(int(cel.Y)+y)*img.Stride+(int(cel.X)+x)*4:]
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

func TestReadAsepriteNativeTiles(t *testing.T) {
	file, err := readAsset("../../internal/demo/assets/atlas/tile.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	if len(file.Tilesets) != 1 || file.Tilesets[0].Header.Count == 0 {
		t.Fatalf("tilesets = %#v, want one nonempty tileset", file.Tilesets)
	}
	_, atlas, keys, err := parseAtlas([]*asset{file})
	if err != nil {
		t.Fatal(err)
	}
	want := int(file.Tilesets[0].Header.Count) + 1
	if len(atlas.Meta) != want || len(keys) != 1 {
		t.Fatalf("got %d anims and %d keys, want %d and 1",
			len(atlas.Meta), len(keys), want)
	}
	for tileID := range file.Tilesets[0].Header.Count {
		meta := &atlas.Meta[int(tileID)+len(keys)]
		if meta.Cels != 1 {
			t.Errorf("tile %d has %d cels, want 1", tileID, meta.Cels)
		}
	}
	manifest, err := genTilesetManifest([]*asset{file}, keys)
	if err != nil {
		t.Fatal(err)
	}
	var got tilesetmanifest.TilesetManifestSpec
	if err := json.Unmarshal(manifest, &got); err != nil {
		t.Fatal(err)
	}
	if len(got.Tilesets) != 1 {
		t.Fatalf("tilesets = %d, want 1", len(got.Tilesets))
	}
	if got.Tags[keys[0].qualifiedTag()] != 0 {
		t.Fatalf("named tags = %v, want %s=0", got.Tags, keys[0].qualifiedTag())
	}
	// Tiled sees the rendered Aseprite canvas as a grid. These cells prove the
	// grid resolves back through the native tilemap to native tile IDs.
	wantTags := map[int]vatlas.Tag{0: 11, 1: 12, 8: 12, 9: 16}
	for cell, want := range wantTags {
		if got := got.Tilesets[0].Tags[cell]; got != want {
			t.Errorf("cell %d meta = %d, want %d", cell, got, want)
		}
	}
}

func TestNewTilesetManifestMultipleNativeTilesets(t *testing.T) {
	visible := vatlas.AseLayerVisibleMask << vatlas.AseLayerVisibleShift
	embedded := vatlas.AseTilesetEmbeddedMask <<
		vatlas.AseTilesetEmbeddedShift
	tilemap := func(x int16, tileID byte) assetCel {
		return assetCel{AseCel: vatlas.AseCel{
			Header: vatlas.AseCelHeader{
				X: x, Type: vatlas.AseCelTilemap,
			},
			Tilemap: vatlas.AseCelTilemapHeader{
				W: 1, H: 1, Bits: 8, ID: 0xff,
			},
			Pxs: []byte{tileID},
		}}
	}
	file := &asset{
		name: "tiles.aseprite", W: 2, H: 1,
		Frames: []assetFrame{{Cels: map[uint16]assetCel{
			0: tilemap(0, 1), 1: tilemap(1, 2),
		}}},
		Layers: []assetLayer{
			{AseLayer: vatlas.AseLayer{
				Header: vatlas.AseLayerHeader{
					Flags: visible, Type: vatlas.AseLayerTilemap,
				},
				Tileset: 0,
			}},
			{AseLayer: vatlas.AseLayer{
				Header: vatlas.AseLayerHeader{
					Flags: visible, Type: vatlas.AseLayerTilemap,
				},
				Tileset: 1,
			}},
		},
		Tilesets: []vatlas.AseTileset{
			{Header: vatlas.AseTilesetHeader{
				Flags: embedded, Count: 2, W: 1, H: 1,
			}},
			{Header: vatlas.AseTilesetHeader{
				Flags: embedded, Count: 3, W: 1, H: 1,
			}},
		},
	}
	manifests, err := newTilesetManifest([]*asset{file}, 10)
	if err != nil {
		t.Fatal(err)
	}
	got := manifests[0].Tags
	if len(got) != 2 || got[0] != 11 || got[1] != 14 {
		t.Fatalf("tags = %v, want [11 14]", got)
	}
}

func TestNewTilesetManifestRejectsLargeTile(t *testing.T) {
	file := &asset{
		name: "large.aseprite", W: 256, H: 1,
		Frames: []assetFrame{{}},
		Tilesets: []vatlas.AseTileset{{Header: vatlas.AseTilesetHeader{
			W: 256, H: 1,
		}}},
	}
	_, err := newTilesetManifest([]*asset{file}, 0)
	if err == nil || !strings.Contains(err.Error(), "outside 1..255") {
		t.Fatalf("err = %v, want uint8 overflow", err)
	}
}

func TestReadAsepriteSprData(t *testing.T) {
	file, err := readAsset("../../internal/demo/assets/atlas/widget.aseprite")
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
	file, err := readAsset("../../internal/demo/assets/atlas/pal.aseprite")
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
	file, err := readAsset("../../internal/demo/assets/atlas/superball.aseprite")
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
		if got, want := atlas.Meta[i].Hitbox, vgeo.XYWH[uint16](1, 1, 6, 6); got != want {
			t.Fatalf("Superball hitbox = %v, want %v", got, want)
		}
		return
	}
	t.Fatal("missing SuperballDefault")
}

func TestParseAtlasKeepsPlayback(t *testing.T) {
	file, err := readAsset("../../internal/demo/assets/atlas/backpacker.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	file.TagSpans[0].Header.Direction = vatlas.AnimDirPingPongReverse
	file.TagSpans[0].Header.Repeat = 3
	from := file.TagSpans[0].Header.From
	file.Frames[from].Millis = 17
	file.Frames[from+1].Millis = 249
	_, atlas, _, err := parseAtlas([]*asset{file})
	if err != nil {
		t.Fatal(err)
	}
	decoded := vatlas.DecodeAtlas(vatlas.EncodeAtlas(atlas))
	meta := decoded.Meta[1]
	if meta.Cels != 8 || meta.Dir != vatlas.AnimDirPingPongReverse || meta.Repeat != 3 ||
		decoded.Cel(1, 0).Millis != 17 || decoded.Cel(1, 1).Millis != 249 {
		t.Fatalf("playback settings changed: %+v", meta)
	}
}

func TestParseFramesRejectsCelOverflow(t *testing.T) {
	file := &asset{Frames: make([]assetFrame, 256)}
	span := assetTagSpan{AseTagSpan: vatlas.AseTagSpan{
		Header: vatlas.AseTagSpanHeader{To: 255},
	}}
	if _, err := parseFrames(file, span); err == nil {
		t.Fatal("256 authored frames were truncated into uint8")
	}
}

func TestParseAtlasRejectsZeroDuration(t *testing.T) {
	file, err := readAsset("../../internal/demo/assets/atlas/backpacker.aseprite")
	if err != nil {
		t.Fatal(err)
	}
	file.Frames[file.TagSpans[0].Header.From].Millis = 0
	_, _, _, err = parseAtlas([]*asset{file})
	if err == nil || !strings.Contains(err.Error(), "has zero duration") {
		t.Fatalf("zero duration error = %v", err)
	}
}

func TestParseAtlasRejectsTotalCelOverflow(t *testing.T) {
	file := &asset{
		name: "limit.aseprite", W: 1, H: 1,
		ColorDepth: vatlas.AseColorRGBA,
		Frames:     make([]assetFrame, 255),
	}
	for i := range file.Frames {
		file.Frames[i].Millis = 1
	}
	// 257 * 255 authored cels plus the nil cel exceed the total by one.
	for i := range 257 {
		file.TagSpans = append(file.TagSpans, assetTagSpan{
			AseTagSpan: vatlas.AseTagSpan{
				Name:   "Tag" + strconv.Itoa(i),
				Header: vatlas.AseTagSpanHeader{To: 254},
			},
		})
	}
	_, _, _, err := parseAtlas([]*asset{file})
	if err == nil || !strings.Contains(err.Error(), "atlas has 65536 cels; maximum is 65535") {
		t.Fatalf("overflow error = %v", err)
	}
}

func TestParseAtlasRepeatLimit(t *testing.T) {
	for _, repeat := range []uint16{0, 255, 256} {
		file := &asset{
			name: "repeat.aseprite", W: 1, H: 1,
			ColorDepth: vatlas.AseColorRGBA, Frames: []assetFrame{{Millis: 1}},
			TagSpans: []assetTagSpan{{AseTagSpan: vatlas.AseTagSpan{
				Name: "Test", Header: vatlas.AseTagSpanHeader{Repeat: repeat},
			}}},
		}
		_, atlas, _, err := parseAtlas([]*asset{file})
		if repeat == 256 {
			if err == nil || !strings.Contains(err.Error(), "repeat count 256 exceeds 255") {
				t.Fatalf("repeat overflow error = %v", err)
			}
		} else if err != nil || uint16(atlas.Meta[1].Repeat) != repeat {
			t.Fatalf("repeat %d: atlas %v, error %v", repeat, atlas, err)
		}
	}
}
