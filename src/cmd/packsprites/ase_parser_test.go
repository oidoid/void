package main

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"errors"
	"io"
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestReadBytes(t *testing.T) {
	want := []byte{1, 2}
	parser := aseParser{bin: append(want, 3)}
	got, err := parser.readBytes(len(want))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, want) || parser.i != len(want) {
		t.Fatalf("got %v, position %d; want %v, position %d",
			got, parser.i, want, len(want))
	}
	_, err = parser.readBytes(2)
	if !errors.Is(err, io.ErrUnexpectedEOF) {
		t.Fatalf("error = %v, want unexpected EOF", err)
	}
}

func TestReadTo(t *testing.T) {
	want := uint16(0x1234)
	parser := aseParser{bin: serializeAse(t, want)}
	var got uint16
	if err := parser.readTo(&got); err != nil {
		t.Fatal(err)
	}
	if got != want || parser.i != 2 {
		t.Fatalf("got %x, position %d; want %x, position 2", got, parser.i, want)
	}
}

func TestReadStr(t *testing.T) {
	want := "tag"
	parser := aseParser{bin: serializeAseStr(t, want)}
	got, err := parser.readStr()
	if err != nil {
		t.Fatal(err)
	}
	if got != want || parser.i != len(want)+2 {
		t.Fatalf("got %q, position %d; want %q, position %d",
			got, parser.i, want, len(want)+2)
	}
}

func TestReadChunk(t *testing.T) {
	want := vatlas.AseChunk{
		Header: vatlas.AseChunkHeader{Type: vatlas.AseChunkUserData},
		UserData: &vatlas.AseUserData{
			Header: vatlas.AseUserDataHeader{
				Flags: vatlas.AseUserDataTextMask << vatlas.AseUserDataTextShift,
			},
			Text: "data",
		},
	}
	body := append(
		serializeAse(t, want.UserData.Header),
		serializeAseStr(t, want.UserData.Text)...,
	)
	want.Header.Size = vatlas.AseChunkHeaderSize + uint32(len(body))
	parser := aseParser{bin: append(serializeAse(t, want.Header), body...)}
	got, err := parser.readChunk(vatlas.AseColorIndexed, 0)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadLayer(t *testing.T) {
	flags := vatlas.AseHeaderLayerUUIDMask << vatlas.AseHeaderLayerUUIDShift
	want := &vatlas.AseLayer{
		Header:  vatlas.AseLayerHeader{Type: vatlas.AseLayerTilemap},
		Name:    "tiles",
		Tileset: 7,
		UUID:    vatlas.AseUUID{1},
	}
	bin := append(serializeAse(t, want.Header), serializeAseStr(t, want.Name)...)
	bin = append(bin, serializeAse(t, want.Tileset, want.UUID)...)
	parser := aseParser{bin: bin}
	got, err := parser.readLayer(flags)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadCel(t *testing.T) {
	for _, test := range []struct {
		name  string
		depth vatlas.AseColorDepth
		want  vatlas.AseCel
	}{
		{
			name:  "raw",
			depth: vatlas.AseColorIndexed,
			want: vatlas.AseCel{
				Header: vatlas.AseCelHeader{Type: vatlas.AseCelRaw},
				Image:  vatlas.AseCelImageHeader{W: 2, H: 1},
				Pxs:    []byte{1, 2},
			},
		},
		{
			name:  "compressed",
			depth: vatlas.AseColorIndexed,
			want: vatlas.AseCel{
				Header: vatlas.AseCelHeader{Type: vatlas.AseCelCompressed},
				Image:  vatlas.AseCelImageHeader{W: 2, H: 1},
				Pxs:    []byte{3, 4},
			},
		},
		{
			name:  "linked",
			depth: vatlas.AseColorIndexed,
			want: vatlas.AseCel{
				Header:      vatlas.AseCelHeader{Type: vatlas.AseCelLinked},
				LinkedFrame: 9,
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			bin := serializeAse(t, test.want.Header)
			switch test.want.Header.Type {
			case vatlas.AseCelLinked:
				bin = append(bin, serializeAse(t, test.want.LinkedFrame)...)
			case vatlas.AseCelRaw:
				bin = append(bin, serializeAse(t, test.want.Image)...)
				bin = append(bin, test.want.Pxs...)
			case vatlas.AseCelCompressed:
				bin = append(bin, serializeAse(t, test.want.Image)...)
				bin = append(bin, compressAse(t, test.want.Pxs)...)
			}
			parser := aseParser{bin: bin}
			got, err := parser.readCel(test.depth)
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(got, &test.want) {
				t.Fatalf("got %#v, want %#v", got, &test.want)
			}
		})
	}
}

func TestReadTags(t *testing.T) {
	want := &vatlas.AseTags{
		Header: vatlas.AseTagsHeader{Count: 1},
		Tags: []vatlas.AseTagSpan{{
			Header: vatlas.AseTagSpanHeader{From: 2, To: 4},
			Name:   "run",
		}},
	}
	bin := serializeAse(t, want.Header, want.Tags[0].Header)
	bin = append(bin, serializeAseStr(t, want.Tags[0].Name)...)
	parser := aseParser{bin: bin}
	got, err := parser.readTags()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadPal(t *testing.T) {
	want := &vatlas.AsePal{
		Header: vatlas.AsePalHeader{Count: 2, From: 1, To: 1},
		Entries: []vatlas.AsePalEntry{{
			Header: vatlas.AsePalEntryHeader{
				Flags: vatlas.AsePalEntryNameMask << vatlas.AsePalEntryNameShift,
				RGBA:  vatlas.AseRGBA{R: 1, G: 2, B: 3, A: 4},
			},
			Name: "red",
		}},
	}
	bin := serializeAse(t, want.Header, want.Entries[0].Header)
	bin = append(bin, serializeAseStr(t, want.Entries[0].Name)...)
	parser := aseParser{bin: bin}
	got, err := parser.readPal()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadOldPal(t *testing.T) {
	want := &vatlas.AseOldPal{
		Header: vatlas.AseOldPalHeader{Count: 1},
		Packets: []vatlas.AseOldPalPacket{{
			Header: vatlas.AseOldPalPacketHeader{Skip: 2, Count: 2},
			RGBs: []vatlas.AseRGB{
				{R: 1, G: 2, B: 3},
				{R: 4, G: 5, B: 6},
			},
		}},
	}
	bin := serializeAse(t, want.Header, want.Packets[0].Header)
	bin = append(bin, serializeAse(t, want.Packets[0].RGBs)...)
	parser := aseParser{bin: bin}
	got, err := parser.readOldPal()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadSlice(t *testing.T) {
	want := &vatlas.AseSlice{
		Header: vatlas.AseSliceHeader{
			KeyCount: 1,
			Flags: vatlas.AseSliceNinePatchMask<<vatlas.AseSliceNinePatchShift |
				vatlas.AseSlicePivotMask<<vatlas.AseSlicePivotShift,
		},
		Name: "button",
		Keys: []vatlas.AseKey{{
			Header: vatlas.AseKeyHeader{Bounds: vatlas.AseXYWH{W: 8, H: 9}},
			Center: &vatlas.AseXYWH{X: 1, Y: 2, W: 3, H: 4},
			Pivot:  &vatlas.AseXY{X: 5, Y: 6},
		}},
	}
	bin := serializeAse(t, want.Header)
	bin = append(bin, serializeAseStr(t, want.Name)...)
	bin = append(bin, serializeAse(t, want.Keys[0].Header)...)
	center, pivot := *want.Keys[0].Center, *want.Keys[0].Pivot
	bin = append(bin, serializeAse(t, center, pivot)...)
	parser := aseParser{bin: bin}
	got, err := parser.readSlice()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadUserData(t *testing.T) {
	want := &vatlas.AseUserData{
		Header: vatlas.AseUserDataHeader{
			Flags: vatlas.AseUserDataTextMask<<vatlas.AseUserDataTextShift |
				vatlas.AseUserDataColorMask<<vatlas.AseUserDataColorShift |
				vatlas.AseUserDataPropsMask<<vatlas.AseUserDataPropsShift,
		},
		Text:  "json",
		RGBA:  vatlas.AseRGBA{R: 1, G: 2, B: 3, A: 4},
		Props: &vatlas.AseUserDataProps{Size: 10, Count: 3, Bin: []byte{8, 9}},
	}
	bin := append(serializeAse(t, want.Header), serializeAseStr(t, want.Text)...)
	bin = append(bin, serializeAse(t,
		want.RGBA, want.Props.Size, want.Props.Count,
	)...)
	bin = append(bin, want.Props.Bin...)
	parser := aseParser{bin: bin}
	got, err := parser.readUserData()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestReadUserDataProps(t *testing.T) {
	want := &vatlas.AseUserDataProps{Size: 9, Count: 2, Bin: []byte{7}}
	bin := serializeAse(t, want.Size, want.Count)
	bin = append(bin, want.Bin...)
	parser := aseParser{bin: bin}
	got, err := parser.readUserDataProps()
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func serializeAse(t *testing.T, vals ...any) []byte {
	t.Helper()
	var out bytes.Buffer
	for _, val := range vals {
		if err := binary.Write(&out, binary.LittleEndian, val); err != nil {
			t.Fatal(err)
		}
	}
	return out.Bytes()
}

func serializeAseStr(t *testing.T, str string) []byte {
	t.Helper()
	return append(serializeAse(t, uint16(len(str))), str...)
}

func compressAse(t *testing.T, bin []byte) []byte {
	t.Helper()
	var out bytes.Buffer
	w, err := zlib.NewWriterLevel(&out, zlib.BestSpeed)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := w.Write(bin); err != nil {
		t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}
