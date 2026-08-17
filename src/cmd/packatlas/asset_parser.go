package main

import (
	"encoding/json"
	"fmt"

	"github.com/oidoid/void/src/void/vatlas"
)

type assetLayer struct {
	vatlas.AseLayer
	RGBA vatlas.AseRGBA
	Data *assetLayerData
}

type assetCel struct {
	vatlas.AseCel
	LinkedFrame int // source frame for linked cels; -1 otherwise.
	RGBA        vatlas.AseRGBA
	Data        *assetCelData
}
type assetTagSpan struct {
	vatlas.AseTagSpan
	RGBA vatlas.AseRGBA
	Data *assetTagData
}
type assetSlice struct {
	vatlas.AseSlice
	RGBA vatlas.AseRGBA
	Data *assetSliceData
}
type assetLayerData struct{}
type assetCelData struct{}
type assetTagData struct{}
type assetSliceData struct{}
type assetData struct {
	Pal string `json:"pal"`
}

// unpacked AseFile representation.
type asset struct {
	// source filename; e.g. `src/demo/assets/atlas/color.aseprite`.
	name             string
	W, H             uint16
	ColorDepth       vatlas.AseColorDepth
	TransparentIndex uint8
	Frames           []assetFrame
	Layers           []assetLayer
	TagSpans         []assetTagSpan
	Slices           []assetSlice
	Tilesets         []vatlas.AseTileset
	RGBA             vatlas.AseRGBA
	Data             *assetData
}
type assetFrame struct {
	Millis uint16
	Cels   map[uint16]assetCel
	Pal    []vatlas.AseRGBA
}

func readAsset(path string) (*asset, error) {
	file, err := readAseFile(path)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	out, err := parseAsset(file)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	out.name = path
	return out, nil
}

func parseAsset(file *vatlas.Ase) (*asset, error) {
	out := &asset{
		W:                file.Header.W,
		H:                file.Header.H,
		ColorDepth:       file.Header.ColorDepth,
		TransparentIndex: file.Header.TransparentIndex,
		Frames:           make([]assetFrame, len(file.Frames)),
	}
	pal := []vatlas.AseRGBA{}
	pendingTags := []int(nil)
	lastCelLayer := uint16(0)
	for frameI, frame := range file.Frames {
		frameOut := assetFrame{
			Millis: frame.Header.Millis, Cels: map[uint16]assetCel{},
		}
		last := vatlas.AseChunkType(0)
		for _, chunk := range frame.Chunks {
			switch {
			case chunk.Layer != nil:
				out.Layers = append(out.Layers, assetLayer{AseLayer: *chunk.Layer})
			case chunk.Cel != nil:
				lastCelLayer = chunk.Cel.Header.Layer
				cel := assetCel{AseCel: *chunk.Cel, LinkedFrame: -1}
				if cel.Header.Type == vatlas.AseCelLinked {
					cel.LinkedFrame = int(cel.AseCel.LinkedFrame)
				}
				frameOut.Cels[lastCelLayer] = cel
			case chunk.Tags != nil:
				start := len(out.TagSpans)
				for _, tag := range chunk.Tags.Tags {
					out.TagSpans = append(out.TagSpans, assetTagSpan{AseTagSpan: tag})
				}
				pendingTags = pendingTags[:0]
				for i := range chunk.Tags.Tags {
					pendingTags = append(pendingTags, start+i)
				}
			case chunk.OldPal != nil:
				pal = parseOldPal(pal, chunk.OldPal)
			case chunk.Pal != nil:
				pal = parsePal(pal, chunk.Pal)
			case chunk.Slice != nil:
				out.Slices = append(out.Slices, assetSlice{AseSlice: *chunk.Slice})
			case chunk.Tileset != nil:
				out.Tilesets = append(out.Tilesets, *chunk.Tileset)
			case chunk.UserData != nil:
				switch {
				case len(pendingTags) != 0:
					data, err := parseUserData[assetTagData](chunk.UserData.Text)
					if err != nil {
						return nil, err
					}
					out.TagSpans[pendingTags[0]].RGBA = chunk.UserData.RGBA
					out.TagSpans[pendingTags[0]].Data = data
					pendingTags = pendingTags[1:]
				case last == vatlas.AseChunkLayer && len(out.Layers) != 0:
					data, err := parseUserData[assetLayerData](chunk.UserData.Text)
					if err != nil {
						return nil, err
					}
					out.Layers[len(out.Layers)-1].RGBA = chunk.UserData.RGBA
					out.Layers[len(out.Layers)-1].Data = data
				case last == vatlas.AseChunkCel:
					data, err := parseUserData[assetCelData](chunk.UserData.Text)
					if err != nil {
						return nil, err
					}
					cel := frameOut.Cels[lastCelLayer]
					cel.RGBA = chunk.UserData.RGBA
					cel.Data = data
					frameOut.Cels[lastCelLayer] = cel
				case (last == vatlas.AseChunkOldPal || last == vatlas.AseChunkPal) &&
					frameI == 0:
					data, err := parseUserData[assetData](chunk.UserData.Text)
					if err != nil {
						return nil, err
					}
					out.RGBA = chunk.UserData.RGBA
					out.Data = data
				case last == vatlas.AseChunkSlice && len(out.Slices) != 0:
					data, err := parseUserData[assetSliceData](chunk.UserData.Text)
					if err != nil {
						return nil, err
					}
					out.Slices[len(out.Slices)-1].Data = data
					out.Slices[len(out.Slices)-1].RGBA = chunk.UserData.RGBA
				}
			}
			last = chunk.Header.Type
		}
		frameOut.Pal = append([]vatlas.AseRGBA(nil), pal...)
		out.Frames[frameI] = frameOut
	}
	if err := validateSliceNames(out); err != nil {
		return nil, err
	}
	return out, nil
}

// verifies every slice belongs to an animation tag.
func validateSliceNames(asset *asset) error {
	tags := make(map[string]bool, len(asset.TagSpans))
	for _, tag := range asset.TagSpans {
		tags[tag.Name] = true
	}
	for _, slice := range asset.Slices {
		if !tags[slice.Name] {
			return fmt.Errorf("atlas slice %q has no matching tag", slice.Name)
		}
	}
	return nil
}

func parsePal(pal []vatlas.AseRGBA, chunk *vatlas.AsePal) []vatlas.AseRGBA {
	for i, entry := range chunk.Entries {
		entryI := int(chunk.Header.From) + i
		if len(pal) <= entryI {
			pal = append(pal, make([]vatlas.AseRGBA, entryI+1-len(pal))...)
		}
		pal[entryI] = entry.Header.RGBA
	}
	return pal
}

func parseOldPal(
	pal []vatlas.AseRGBA, chunk *vatlas.AseOldPal,
) []vatlas.AseRGBA {
	entryI := 0
	for _, packet := range chunk.Packets {
		entryI += int(packet.Header.Skip)
		for _, color := range packet.RGBs {
			if len(pal) <= entryI {
				pal = append(pal, make([]vatlas.AseRGBA, entryI+1-len(pal))...)
			}
			pal[entryI] = vatlas.AseRGBA{R: color.R, G: color.G, B: color.B, A: 255}
			entryI++
		}
	}
	return pal
}

func parseUserData[T any](text string) (*T, error) {
	if text == "" {
		return nil, nil
	}
	data := new(T)
	if err := json.Unmarshal([]byte(text), data); err != nil {
		return nil, err
	}
	return data, nil
}
