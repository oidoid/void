package main

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"fmt"
	"io"
	"os"

	"github.com/oidoid/void/src/void/vatlas"
)

type aseParser struct {
	bin []byte // an Aseprite binary.
	i   int    // read position.
}

func (this *aseParser) readBytes(n int) ([]byte, error) {
	if n < 0 || len(this.bin)-this.i < n {
		return nil, io.ErrUnexpectedEOF
	}
	v := this.bin[this.i : this.i+n]
	this.i += n
	return v, nil
}

func (this *aseParser) readTo(data any) error {
	n, err := binary.Decode(this.bin[this.i:], binary.LittleEndian, data)
	if err != nil {
		return err
	}
	this.i += n
	return nil
}

func (this *aseParser) readStr() (string, error) {
	var n uint16
	if err := this.readTo(&n); err != nil {
		return "", err
	}
	bin, err := this.readBytes(int(n))
	return string(bin), err
}

func readAseFile(path string) (*vatlas.Ase, error) {
	bin, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	r := &aseParser{bin: bin}
	file := &vatlas.Ase{}
	if err := r.readTo(&file.Header); err != nil {
		return nil, err
	}
	if file.Header.Magic != vatlas.AseFileMagic {
		return nil, fmt.Errorf("not an Aseprite file")
	}
	if file.Header.ColorDepth != vatlas.AseColorIndexed &&
		file.Header.ColorDepth != vatlas.AseColorRGBA {
		return nil, fmt.Errorf(
			"color depth %d is unsupported", file.Header.ColorDepth,
		)
	}

	file.Frames = make([]vatlas.AseFrame, file.Header.FrameCount)
	for i := range file.Frames {
		frameStart := r.i
		frame := &file.Frames[i]
		if err := r.readTo(&frame.Header); err != nil {
			return nil, fmt.Errorf("frame %d: %w", i, err)
		}
		frameEnd := frameStart + int(frame.Header.Size)
		if frame.Header.Magic != vatlas.AseFrameMagic {
			return nil, fmt.Errorf("frame %d: invalid magic", i)
		}
		frame.Chunks = make([]vatlas.AseChunk, 0, frame.Header.ChunkCount)
		for range frame.Header.ChunkCount {
			chunk, err := r.readChunk(file.Header.ColorDepth, file.Header.Flags)
			if err != nil {
				return nil, fmt.Errorf("frame %d: %w", i, err)
			}
			frame.Chunks = append(frame.Chunks, chunk)
		}
		if r.i != frameEnd {
			return nil, fmt.Errorf("frame %d: chunk sizes do not match frame", i)
		}
	}
	return file, nil
}

func (this *aseParser) readChunk(
	depth vatlas.AseColorDepth,
	flags uint32,
) (vatlas.AseChunk, error) {
	chunk := vatlas.AseChunk{}
	if err := this.readTo(&chunk.Header); err != nil {
		return vatlas.AseChunk{}, err
	}
	if chunk.Header.Size < vatlas.AseChunkHeaderSize {
		return vatlas.AseChunk{}, fmt.Errorf(
			"invalid chunk size %d", chunk.Header.Size,
		)
	}
	body, err := this.readBytes(int(chunk.Header.Size - vatlas.AseChunkHeaderSize))
	if err != nil {
		return vatlas.AseChunk{}, err
	}
	chunkReader := &aseParser{bin: body}
	switch chunk.Header.Type {
	case vatlas.AseChunkOldPal:
		chunk.OldPal, err = chunkReader.readOldPal()
	case vatlas.AseChunkLayer:
		chunk.Layer, err = chunkReader.readLayer(flags)
	case vatlas.AseChunkCel:
		chunk.Cel, err = chunkReader.readCel(depth)
	case vatlas.AseChunkTags:
		chunk.Tags, err = chunkReader.readTags()
	case vatlas.AseChunkPal:
		chunk.Pal, err = chunkReader.readPal()
	case vatlas.AseChunkUserData:
		chunk.UserData, err = chunkReader.readUserData()
	case vatlas.AseChunkSlice:
		chunk.Slice, err = chunkReader.readSlice()
	}
	return chunk, err
}

func (this *aseParser) readLayer(flags uint32) (*vatlas.AseLayer, error) {
	layer := &vatlas.AseLayer{}
	if err := this.readTo(&layer.Header); err != nil {
		return nil, err
	}
	name, err := this.readStr()
	if err != nil {
		return nil, err
	}
	layer.Name = name
	if layer.Header.Type == vatlas.AseLayerTilemap {
		if err := this.readTo(&layer.Tileset); err != nil {
			return nil, err
		}
	}
	if flags>>vatlas.AseHeaderLayerUUIDShift&vatlas.AseHeaderLayerUUIDMask != 0 {
		if err := this.readTo(&layer.UUID); err != nil {
			return nil, err
		}
	}
	return layer, nil
}

func (this *aseParser) readCel(
	depth vatlas.AseColorDepth,
) (*vatlas.AseCel, error) {
	cel := &vatlas.AseCel{}
	if err := this.readTo(&cel.Header); err != nil {
		return nil, err
	}
	if cel.Header.Type == vatlas.AseCelLinked {
		err := this.readTo(&cel.LinkedFrame)
		return cel, err
	}
	n := 0
	switch cel.Header.Type {
	case vatlas.AseCelRaw, vatlas.AseCelCompressed:
		if err := this.readTo(&cel.Image); err != nil {
			return nil, err
		}
		n = int(cel.Image.W) * int(cel.Image.H) * int(depth/8)
	case vatlas.AseCelTilemap:
		if err := this.readTo(&cel.Tilemap); err != nil {
			return nil, err
		}
		n = int(cel.Tilemap.W) * int(cel.Tilemap.H) * int(cel.Tilemap.Bits/8)
	default:
		return nil, fmt.Errorf("unsupported cel type %d", cel.Header.Type)
	}
	if cel.Header.Type == vatlas.AseCelRaw {
		bin, err := this.readBytes(n)
		cel.Pxs = bin
		return cel, err
	}
	z, err := zlib.NewReader(bytes.NewReader(this.bin[this.i:]))
	if err != nil {
		return nil, err
	}
	cel.Pxs, err = io.ReadAll(z)
	closeErr := z.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return nil, err
	}
	if len(cel.Pxs) != n {
		return nil, fmt.Errorf(
			"compressed cel decoded %d pixels, want %d", len(cel.Pxs), n,
		)
	}
	return cel, nil
}

func (this *aseParser) readTags() (*vatlas.AseTags, error) {
	tags := &vatlas.AseTags{}
	if err := this.readTo(&tags.Header); err != nil {
		return nil, err
	}
	tags.Tags = make([]vatlas.AseTagSpan, tags.Header.Count)
	for i := range tags.Tags {
		if err := this.readTo(&tags.Tags[i].Header); err != nil {
			return nil, err
		}
		name, err := this.readStr()
		if err != nil {
			return nil, err
		}
		tags.Tags[i].Name = name
	}
	return tags, nil
}

func (this *aseParser) readPal() (*vatlas.AsePal, error) {
	pal := &vatlas.AsePal{}
	if err := this.readTo(&pal.Header); err != nil {
		return nil, err
	}
	if pal.Header.To < pal.Header.From ||
		pal.Header.To >= pal.Header.Count {
		return nil, fmt.Errorf(
			"invalid pal range %d..%d for size %d",
			pal.Header.From,
			pal.Header.To,
			pal.Header.Count,
		)
	}
	pal.Entries = make(
		[]vatlas.AsePalEntry, 0, pal.Header.To-pal.Header.From+1,
	)
	for i := pal.Header.From; i <= pal.Header.To; i++ {
		entry := vatlas.AsePalEntry{}
		if err := this.readTo(&entry.Header); err != nil {
			return nil, err
		}
		nameFlags := entry.Header.Flags >> vatlas.AsePalEntryNameShift
		if nameFlags&vatlas.AsePalEntryNameMask != 0 {
			name, err := this.readStr()
			if err != nil {
				return nil, err
			}
			entry.Name = name
		}
		pal.Entries = append(pal.Entries, entry)
	}
	return pal, nil
}

func (this *aseParser) readOldPal() (*vatlas.AseOldPal, error) {
	pal := &vatlas.AseOldPal{}
	if err := this.readTo(&pal.Header); err != nil {
		return nil, err
	}
	pal.Packets = make([]vatlas.AseOldPalPacket, pal.Header.Count)
	for i := range pal.Packets {
		packet := &pal.Packets[i]
		if err := this.readTo(&packet.Header); err != nil {
			return nil, err
		}
		count := int(packet.Header.Count)
		if count == 0 {
			count = vatlas.AseOldPalColorsMax
		}
		packet.RGBs = make([]vatlas.AseRGB, count)
		for i := range packet.RGBs {
			if err := this.readTo(&packet.RGBs[i]); err != nil {
				return nil, err
			}
		}
	}
	return pal, nil
}

func (this *aseParser) readSlice() (*vatlas.AseSlice, error) {
	slice := &vatlas.AseSlice{}
	if err := this.readTo(&slice.Header); err != nil {
		return nil, err
	}
	name, err := this.readStr()
	if err != nil {
		return nil, err
	}
	slice.Name = name
	slice.Keys = make([]vatlas.AseKey, slice.Header.KeyCount)
	for i := range slice.Keys {
		k := &slice.Keys[i]
		if err := this.readTo(&k.Header); err != nil {
			return nil, err
		}
		hasNinePatch := slice.Header.Flags>>vatlas.AseSliceNinePatchShift&
			vatlas.AseSliceNinePatchMask != 0
		hasPivot := slice.Header.Flags>>vatlas.AseSlicePivotShift&
			vatlas.AseSlicePivotMask != 0
		if hasNinePatch {
			center := vatlas.AseXYWH{}
			if err := this.readTo(&center); err != nil {
				return nil, err
			}
			k.Center = &center
		}
		if hasPivot {
			pivot := vatlas.AseXY{}
			if err := this.readTo(&pivot); err != nil {
				return nil, err
			}
			k.Pivot = &pivot
		}
	}
	return slice, nil
}

func (this *aseParser) readUserData() (*vatlas.AseUserData, error) {
	data := &vatlas.AseUserData{}
	if err := this.readTo(&data.Header); err != nil {
		return nil, err
	}
	flags := data.Header.Flags
	if flags>>vatlas.AseUserDataTextShift&vatlas.AseUserDataTextMask != 0 {
		text, err := this.readStr()
		if err != nil {
			return nil, err
		}
		data.Text = text
	}
	if flags>>vatlas.AseUserDataColorShift&vatlas.AseUserDataColorMask != 0 {
		if err := this.readTo(&data.RGBA); err != nil {
			return nil, err
		}
	}
	if flags>>vatlas.AseUserDataPropsShift&vatlas.AseUserDataPropsMask != 0 {
		props, err := this.readUserDataProps()
		if err != nil {
			return nil, err
		}
		data.Props = props
	}
	return data, nil
}

func (this *aseParser) readUserDataProps() (*vatlas.AseUserDataProps, error) {
	props := &vatlas.AseUserDataProps{}
	if err := this.readTo(&props.Size); err != nil {
		return nil, err
	}
	if props.Size < 8 {
		return nil, fmt.Errorf(
			"invalid user-data properties size %d", props.Size,
		)
	}
	if err := this.readTo(&props.Count); err != nil {
		return nil, err
	}
	bin, err := this.readBytes(int(props.Size) - 8)
	if err != nil {
		return nil, err
	}
	props.Bin = bin
	return props, nil
}
