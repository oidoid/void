package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"path/filepath"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vatlas"
)

func genTilesetManifest(
	assets []*asset, firstTag vatlas.Tag,
) ([]byte, error) {
	tilesets, err := newTilesetManifest(assets, firstTag)
	if err != nil {
		return nil, err
	}
	bin, err := json.MarshalIndent(tilesets, "", "  ")
	return append(bin, '\n'), err
}

// native tiles follow public animations in asset, tileset, then native tile-ID
// order. firstTag therefore resolves every native tile directly. The
// build-only result lets packboards translate each Tiled preview cell to its
// final tag.
func newTilesetManifest(
	assets []*asset, firstTag vatlas.Tag,
) ([]tilesetmanifest.TilesetManifest, error) {
	this := make([]tilesetmanifest.TilesetManifest, 0, len(assets))
	for _, asset := range assets {
		if len(asset.Tilesets) == 0 {
			continue
		}
		tileset, err := mapTileset(asset, firstTag)
		if err != nil {
			return nil, err
		}
		this = append(this, tileset)
		for tilesetI := range asset.Tilesets {
			firstTag += vatlas.Tag(asset.Tilesets[tilesetI].Header.Count)
		}
	}
	return this, nil
}

func mapTileset(
	asset *asset, firstTag vatlas.Tag,
) (tilesetmanifest.TilesetManifest, error) {
	if len(asset.Frames) == 0 {
		return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
			"%s: native tiles have no frame", asset.name,
		)
	}
	first := &asset.Tilesets[0]
	if first.Header.W == 0 || first.Header.H == 0 ||
		first.Header.W > 255 || first.Header.H > 255 {
		return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
			"%s: tile size %dx%d is outside 1..255", asset.name,
			first.Header.W, first.Header.H,
		)
	}
	if asset.W%first.Header.W != 0 || asset.H%first.Header.H != 0 {
		return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
			"%s: image %dx%d is not divisible by tile size %dx%d",
			asset.name,
			asset.W, asset.H,
			first.Header.W, first.Header.H,
		)
	}
	cols := int(asset.W / first.Header.W)
	rows := int(asset.H / first.Header.H)
	this := tilesetmanifest.TilesetManifest{
		Path: filepath.ToSlash(filepath.Clean(asset.name)),
		W:    asset.W, H: asset.H,
		TileW: uint8(first.Header.W), TileH: uint8(first.Header.H),
		Tags: make([]vatlas.Tag, cols*rows),
	}
	mapped := false
	for layerI, layer := range asset.Layers {
		if layer.Header.Type != vatlas.AseLayerTilemap ||
			layer.Header.Flags>>vatlas.AseLayerVisibleShift&
				vatlas.AseLayerVisibleMask == 0 {
			continue
		}
		if int(layer.Tileset) >= len(asset.Tilesets) {
			return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
				"%s: layer %q tileset %d is missing",
				asset.name, layer.Name, layer.Tileset,
			)
		}
		tileset := &asset.Tilesets[layer.Tileset]
		tilesetTag := firstTag
		for tilesetI := range int(layer.Tileset) {
			tilesetTag += vatlas.Tag(
				asset.Tilesets[tilesetI].Header.Count,
			)
		}
		if tileset.Header.W != first.Header.W || tileset.Header.H != first.Header.H {
			return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
				"%s: native tilesets use different tile sizes", asset.name,
			)
		}
		cel, ok := asset.Frames[0].Cels[uint16(layerI)]
		if !ok {
			continue
		}
		if cel.Header.Type != vatlas.AseCelTilemap {
			return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
				"%s: layer %q cel is not a tilemap", asset.name, layer.Name,
			)
		}
		if err := mapTileCel(
			&this, cols, rows, tileset, &cel, tilesetTag,
		); err != nil {
			return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
				"%s: layer %q: %w", asset.name, layer.Name, err,
			)
		}
		mapped = true
	}
	if !mapped {
		return tilesetmanifest.TilesetManifest{}, fmt.Errorf(
			"%s: native tiles have no tilemap cel", asset.name,
		)
	}
	return this, nil
}

func mapTileCel(
	tilesetManifest *tilesetmanifest.TilesetManifest,
	cols, rows int,
	tileset *vatlas.AseTileset,
	cel *assetCel,
	firstTag vatlas.Tag,
) error {
	if cel.Tilemap.Bits != 8 && cel.Tilemap.Bits != 16 && cel.Tilemap.Bits != 32 {
		return fmt.Errorf("%d-bit tile IDs are unsupported", cel.Tilemap.Bits)
	}
	byteLen := int(cel.Tilemap.Bits / 8)
	flips := cel.Tilemap.XFlip | cel.Tilemap.YFlip | cel.Tilemap.DiagonalFlip
	for y := range int(cel.Tilemap.H) {
		for x := range int(cel.Tilemap.W) {
			i := (y*int(cel.Tilemap.W) + x) * byteLen
			val := uint32(cel.Pxs[i])
			if byteLen >= 2 {
				val = uint32(binary.LittleEndian.Uint16(cel.Pxs[i:]))
			}
			if byteLen == 4 {
				val = binary.LittleEndian.Uint32(cel.Pxs[i:])
			}
			if val&flips != 0 {
				return fmt.Errorf("flipped source tile at %d,%d is unsupported", x, y)
			}
			tileID := val & cel.Tilemap.ID
			if tileID >= tileset.Header.Count {
				return fmt.Errorf("tile ID %d exceeds count %d", tileID, tileset.Header.Count)
			}
			dstX := int(cel.Header.X) + x
			dstY := int(cel.Header.Y) + y
			if dstX < 0 || dstX >= cols || dstY < 0 || dstY >= rows {
				return fmt.Errorf("tile at %d,%d exceeds image bounds", dstX, dstY)
			}
			if tileID == 0 && tileset.Header.Flags>>vatlas.AseTilesetZeroEmptyShift&
				vatlas.AseTilesetZeroEmptyMask != 0 {
				continue
			}
			tilesetManifest.Tags[dstY*cols+dstX] =
				firstTag + vatlas.Tag(tileID)
		}
	}
	return nil
}
