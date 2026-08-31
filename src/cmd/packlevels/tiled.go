package main

// https://doc.mapeditor.org/en/stable/reference/tmx-map-format/

import (
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vlevels"
)

const maxI32 = 1<<31 - 1
const tiledFlipMask uint32 = 0xf0000000

// indexes atlas mappings by normalized absolute Aseprite path.
type tilesetIndex map[string]*tilesetmanifest.TilesetManifest

// supported subset of a finite orthogonal TMX map.
type tmxMap struct {
	// projection; only `orthogonal` is accepted.
	Orientation string `xml:"orientation,attr"`
	// nonzero for unbounded maps, which are unsupported.
	Infinite int `xml:"infinite,attr"`
	// grid dimensions in tiles.
	W uint32 `xml:"width,attr"`
	H uint32 `xml:"height,attr"`
	// cell dimensions in pixels.
	TileW uint8 `xml:"tilewidth,attr"`
	TileH uint8 `xml:"tileheight,attr"`
	// external TSX references and their map-local GID ranges.
	Tilesets []tmxTileset `xml:"tileset"`
	// tile grids; exactly one is currently supported.
	Layers []tmxLayer `xml:"layer"`
}

// map-local reference to an external TSX tileset.
type tmxTileset struct {
	// first global tile ID assigned to the referenced tileset.
	FirstGID uint32 `xml:"firstgid,attr"`
	// TMX-relative TSX path.
	Source string `xml:"source,attr"`
	// atlas mapping resolved from the external TSX image.
	manifest *tilesetmanifest.TilesetManifest
	// local tile ID to `hits` property.
	hits []bool
}

// supported subset of an external TSX tileset.
type tsxTileset struct {
	// cell dimensions in pixels.
	TileW uint8 `xml:"tilewidth,attr"`
	TileH uint8 `xml:"tileheight,attr"`
	// number of preview cells.
	TileCount uint32 `xml:"tilecount,attr"`
	// preview grid width in cells.
	Cols uint32 `xml:"columns,attr"`
	// rendered Aseprite preview canvas.
	Image tsxImage `xml:"image"`
	// sparse tile metadata identified by local ID.
	Tiles []tsxTile `xml:"tile"`
}

type tsxTile struct {
	ID    uint32    `xml:"id,attr"`
	Props []tsxProp `xml:"properties>property"`
}

type tsxProp struct {
	Name  string `xml:"name,attr"`
	Type  string `xml:"type,attr"`
	Value string `xml:"value,attr"`
}

// image reference used by Tiled to display a tileset preview.
type tsxImage struct {
	// TSX-relative Aseprite path.
	Source string `xml:"source,attr"`
	// rendered preview canvas dimensions in pixels.
	W uint16 `xml:"width,attr"`
	H uint16 `xml:"height,attr"`
}

// finite tile grid from a TMX `layer` element.
type tmxLayer struct {
	// grid origin in tiles; must match the map origin.
	X int32 `xml:"x,attr"`
	Y int32 `xml:"y,attr"`
	// grid dimensions in tiles; must match the map.
	W uint32 `xml:"width,attr"`
	H uint32 `xml:"height,attr"`
	// encoded row-major global tile IDs.
	Data tmxData `xml:"data"`
}

// encoded contents of a TMX tile layer.
type tmxData struct {
	// payload format; only `csv` is accepted.
	Encoding string `xml:"encoding,attr"`
	// comma-separated global tile IDs.
	CSV string `xml:",chardata"`
}

func newTilesetIndex(
	tilesets []tilesetmanifest.TilesetManifest,
) (tilesetIndex, error) {
	this := make(tilesetIndex, len(tilesets))
	for i := range tilesets {
		tileset := &tilesets[i]
		path, err := filepath.Abs(tileset.Path)
		if err != nil {
			return nil, err
		}
		path = filepath.Clean(path)
		if this[path] != nil {
			return nil, fmt.Errorf("tileset path %q is duplicate", tileset.Path)
		}
		this[path] = tileset
	}
	return this, nil
}

func readLevel(path string, tilesets tilesetIndex) (vlevels.Level, error) {
	bin, err := os.ReadFile(path)
	if err != nil {
		return vlevels.Level{}, err
	}
	tmx := tmxMap{}
	if err := xml.Unmarshal(bin, &tmx); err != nil {
		return vlevels.Level{}, err
	}
	if tmx.Orientation != "orthogonal" || tmx.Infinite != 0 {
		return vlevels.Level{}, fmt.Errorf("only finite orthogonal maps are supported")
	}
	if tmx.W == 0 || tmx.H == 0 || tmx.TileW == 0 || tmx.TileH == 0 {
		return vlevels.Level{}, fmt.Errorf("invalid map or tile dimensions")
	}
	if len(tmx.Layers) != 1 {
		return vlevels.Level{}, fmt.Errorf("got %d tile layers, want 1", len(tmx.Layers))
	}
	layer := tmx.Layers[0]
	if layer.X != 0 || layer.Y != 0 || layer.W != tmx.W || layer.H != tmx.H {
		return vlevels.Level{}, fmt.Errorf("tile layer bounds differ from map")
	}
	for i := range tmx.Tilesets {
		if err := loadTileset(
			path, &tmx.Tilesets[i], tmx.TileW, tmx.TileH, tilesets,
		); err != nil {
			return vlevels.Level{}, err
		}
		if i != 0 && tmx.Tilesets[i-1].FirstGID >= tmx.Tilesets[i].FirstGID {
			return vlevels.Level{}, fmt.Errorf("tilesets are not in increasing firstgid order")
		}
	}
	if len(tmx.Tilesets) == 0 {
		return vlevels.Level{}, fmt.Errorf("map has no tileset")
	}
	gids, err := parseCSV(layer.Data)
	if err != nil {
		return vlevels.Level{}, err
	}
	total := uint64(tmx.W) * uint64(tmx.H)
	if total > uint64(^uint32(0)) {
		return vlevels.Level{}, fmt.Errorf("level tile count exceeds uint32")
	}
	if uint64(len(gids)) != total {
		return vlevels.Level{}, fmt.Errorf("got %d tiles, want %d", len(gids), total)
	}
	tiles := make([]vlevels.Tile, len(gids))
	for i, gid := range gids {
		tile, err := tileForGID(gid, tmx.Tilesets)
		if err != nil {
			return vlevels.Level{}, fmt.Errorf("tile %d: %w", i, err)
		}
		tiles[i] = tile
	}
	w := uint64(tmx.W) * uint64(tmx.TileW)
	h := uint64(tmx.H) * uint64(tmx.TileH)
	if w > maxI32 || h > maxI32 {
		return vlevels.Level{}, fmt.Errorf("level dimensions exceed int32")
	}
	return vlevels.Level{
		WH:    vgeo.NewWH(int32(w), int32(h)),
		Tile:  vgeo.NewWH(tmx.TileW, tmx.TileH),
		Tiles: tiles,
	}, nil
}

// resolves a Tiled global tile ID to its final packed tile.
func tileForGID(gid uint32, tilesets []tmxTileset) (vlevels.Tile, error) {
	if gid == 0 {
		return 0, nil
	}
	if gid&tiledFlipMask != 0 {
		return 0, fmt.Errorf("GID %d uses unsupported flip flags", gid)
	}
	tileset := &tilesets[0]
	for i := 1; i < len(tilesets) && tilesets[i].FirstGID <= gid; i++ {
		tileset = &tilesets[i]
	}
	if gid < tileset.FirstGID {
		return 0, fmt.Errorf("GID %d has no tileset", gid)
	}
	// Tiled GID -> preview canvas cell -> Aseprite native tile -> final tag.
	// adjacent preview cells may resolve to non-contiguous tags.
	localID := gid - tileset.FirstGID
	if localID >= uint32(len(tileset.manifest.Tags)) {
		return 0,
			fmt.Errorf("GID %d local ID %d is out of range of tags", gid, localID)
	}
	if int(localID) >= len(tileset.hits) {
		return 0,
			fmt.Errorf("GID %d local ID %d is out of range of hits", gid, localID)
	}
	hits := tileset.hits[localID]
	return vlevels.NewTile(tileset.manifest.Tags[localID], hits), nil
}

func loadTileset(
	tmxPath string,
	ref *tmxTileset,
	tileW, tileH uint8,
	tilesets tilesetIndex,
) error {
	if ref.FirstGID == 0 || ref.Source == "" {
		return fmt.Errorf("only external tilesets with nonzero firstgid are supported")
	}
	path := filepath.Join(filepath.Dir(tmxPath), filepath.FromSlash(ref.Source))
	bin, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	this := tsxTileset{}
	if err := xml.Unmarshal(bin, &this); err != nil {
		return err
	}
	imagePath, err := filepath.Abs(filepath.Join(
		filepath.Dir(path), filepath.FromSlash(this.Image.Source),
	))
	if err != nil {
		return err
	}
	manifest := tilesets[filepath.Clean(imagePath)]
	if manifest == nil {
		return fmt.Errorf("tileset image %q is missing from atlas", this.Image.Source)
	}
	if this.TileW != tileW || this.TileH != tileH {
		return fmt.Errorf("tileset tile size differs from map")
	}
	if this.TileW != manifest.TileW || this.TileH != manifest.TileH ||
		this.Image.W != manifest.W || this.Image.H != manifest.H ||
		this.TileCount != uint32(len(manifest.Tags)) || this.Cols == 0 ||
		this.TileCount%this.Cols != 0 ||
		uint64(this.Cols)*uint64(this.TileW) != uint64(this.Image.W) ||
		uint64(this.TileCount/this.Cols)*uint64(this.TileH) != uint64(this.Image.H) {
		return fmt.Errorf("tileset dimensions differ from Aseprite manifest")
	}
	hits, err := parseTileHits(&this)
	if err != nil {
		return err
	}
	ref.manifest = manifest
	ref.hits = hits
	return nil
}

func parseTileHits(tileset *tsxTileset) ([]bool, error) {
	hits := make([]bool, tileset.TileCount)
	for _, tile := range tileset.Tiles {
		if tile.ID >= tileset.TileCount {
			return nil, fmt.Errorf("tile ID %d is out of range", tile.ID)
		}
		for _, prop := range tile.Props {
			if prop.Name != "hits" {
				continue
			}
			if prop.Type != "bool" {
				return nil, fmt.Errorf(
					"tile ID %d property %q must be bool", tile.ID, prop.Name,
				)
			}
			switch prop.Value {
			case "", "false":
				hits[tile.ID] = false
			case "true":
				hits[tile.ID] = true
			default:
				return nil, fmt.Errorf(
					"tile ID %d property %q has invalid bool %q",
					tile.ID, prop.Name, prop.Value,
				)
			}
		}
	}
	return hits, nil
}

func parseCSV(data tmxData) ([]uint32, error) {
	if data.Encoding != "csv" {
		return nil, fmt.Errorf("tile data encoding %q is unsupported", data.Encoding)
	}
	fields := strings.FieldsFunc(data.CSV, func(ch rune) bool {
		return ch == ',' || unicode.IsSpace(ch)
	})
	gids := make([]uint32, len(fields))
	for i, field := range fields {
		gid, err := strconv.ParseUint(field, 10, 32)
		if err != nil {
			return nil, fmt.Errorf("tile %d: %w", i, err)
		}
		gids[i] = uint32(gid)
	}
	return gids, nil
}
