package main

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestParsePal(t *testing.T) {
	red := vatlas.AseRGBA{R: 1, A: 255}
	blue := vatlas.AseRGBA{B: 2, A: 255}
	got := parsePal([]vatlas.AseRGBA{{G: 3, A: 255}}, &vatlas.AsePal{
		Header: vatlas.AsePalHeader{From: 2},
		Entries: []vatlas.AsePalEntry{
			{Header: vatlas.AsePalEntryHeader{RGBA: red}},
			{Header: vatlas.AsePalEntryHeader{RGBA: blue}},
		},
	})
	want := []vatlas.AseRGBA{{G: 3, A: 255}, {}, red, blue}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("palette = %#v, want %#v", got, want)
	}
}

func TestParseOldPal(t *testing.T) {
	got := parseOldPal(nil, &vatlas.AseOldPal{Packets: []vatlas.AseOldPalPacket{{
		Header: vatlas.AseOldPalPacketHeader{Skip: 1, Count: 2},
		RGBs:   []vatlas.AseRGB{{R: 1}, {G: 2}},
	}}})
	want := []vatlas.AseRGBA{{}, {R: 1, A: 255}, {G: 2, A: 255}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("palette = %#v, want %#v", got, want)
	}
}

func TestParseUserData(t *testing.T) {
	for _, test := range []struct {
		text string
		want *assetData
		err  bool
	}{
		{"", nil, false},
		{"{\"pal\":\"Widget\"}", &assetData{Pal: "Widget"}, false},
		{"{", nil, true},
	} {
		got, err := parseUserData[assetData](test.text)
		if (err != nil) != test.err {
			t.Fatalf("parseUserData(%q) error = %v", test.text, err)
		}
		if !reflect.DeepEqual(got, test.want) {
			t.Fatalf("parseUserData(%q) = %#v, want %#v", test.text, got, test.want)
		}
	}
}

func TestParseAsset(t *testing.T) {
	color := vatlas.AseRGBA{R: 1, G: 2, B: 3, A: 255}
	data := func(text string) vatlas.AseChunk {
		return vatlas.AseChunk{
			Header:   vatlas.AseChunkHeader{Type: vatlas.AseChunkUserData},
			UserData: &vatlas.AseUserData{Text: text, RGBA: color},
		}
	}
	file := &vatlas.Ase{
		Header: vatlas.AseHeader{
			W: 4, H: 5, ColorDepth: vatlas.AseColorIndexed,
			TransparentIndex: 7,
		},
		Frames: []vatlas.AseFrame{
			{
				Header: vatlas.AseFrameHeader{Millis: 10},
				Chunks: []vatlas.AseChunk{
					{
						Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkLayer},
						Layer:  &vatlas.AseLayer{Name: "body"},
					},
					data("{}"),
					{
						Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkCel},
						Cel: &vatlas.AseCel{Header: vatlas.AseCelHeader{
							Layer: 3, Type: vatlas.AseCelLinked,
						}, LinkedFrame: 2},
					},
					data("{}"),
					{
						Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkTags},
						Tags: &vatlas.AseTags{Tags: []vatlas.AseTagSpan{
							{Name: "idle"}, {Name: "run"},
						}},
					},
					data("{}"), data("{}"),
					{
						Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkPal},
						Pal: &vatlas.AsePal{Entries: []vatlas.AsePalEntry{{
							Header: vatlas.AsePalEntryHeader{RGBA: color},
						}}},
					},
					data("{\"pal\":\"Widget\"}"),
					{
						Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkSlice},
						Slice:  &vatlas.AseSlice{Name: "idle"},
					},
					data("{}"),
				},
			},
			{
				Header: vatlas.AseFrameHeader{Millis: 20},
				Chunks: []vatlas.AseChunk{{
					Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkPal},
					Pal: &vatlas.AsePal{Entries: []vatlas.AsePalEntry{{
						Header: vatlas.AsePalEntryHeader{RGBA: vatlas.AseRGBA{G: 9}},
					}}},
				}},
			},
		},
	}
	got, err := parseAsset(file)
	if err != nil {
		t.Fatal(err)
	}
	if got.W != 4 || got.H != 5 || got.TransparentIndex != 7 ||
		got.Data == nil || got.Data.Pal != "Widget" || got.RGBA != color {
		t.Fatalf("asset header = %#v", got)
	}
	if got.Frames[0].Millis != 10 || got.Frames[1].Millis != 20 ||
		!reflect.DeepEqual(got.Frames[0].Pal, []vatlas.AseRGBA{color}) ||
		!reflect.DeepEqual(got.Frames[1].Pal, []vatlas.AseRGBA{{G: 9}}) {
		t.Fatalf("asset frames = %#v", got.Frames)
	}
	if len(got.Layers) != 1 || got.Layers[0].Data == nil ||
		got.Layers[0].RGBA != color || len(got.Frames[0].Cels) != 1 ||
		got.Frames[0].Cels[3].LinkedFrame != 2 ||
		got.Frames[0].Cels[3].Data == nil ||
		got.Frames[0].Cels[3].RGBA != color {
		t.Fatalf("asset layers or cels = %#v", got)
	}
	if len(got.TagSpans) != 2 || got.TagSpans[0].Name != "idle" ||
		got.TagSpans[0].Data == nil || got.TagSpans[1].Name != "run" ||
		got.TagSpans[1].Data == nil || len(got.Slices) != 1 ||
		got.Slices[0].Data == nil || got.Slices[0].RGBA != color {
		t.Fatalf("asset tags or slices = %#v", got)
	}
}
