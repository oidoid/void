package main

// https://doc.mapeditor.org/en/stable/reference/tmx-map-format/

import (
	"encoding/xml"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

const maxI32 = 1<<31 - 1
const (
	tiledFlipXMask     uint32 = 0x80000000
	tiledFlipYMask     uint32 = 0x40000000
	tiledFlipDiagMask  uint32 = 0x20000000
	tiledHexRotateMask uint32 = 0x10000000
	tiledFlipMask             = tiledFlipXMask | tiledFlipYMask |
		tiledFlipDiagMask | tiledHexRotateMask
	tiledBadSpawnFlipMask = tiledFlipDiagMask | tiledHexRotateMask
)
const tiledDegToRot = float32(-math.Pi / 180)

// indexes atlas mappings by normalized absolute Aseprite path.
type tilesetIndex map[string]*tilesetmanifest.TilesetSpec

// build-only data used to generate a runtime board and typed app spawns.
type spawnBoardSpec struct {
	vboards.Board
	Spawns []spawnGroupSpec
}

// groups creation specs sharing a Tiled class and generated Go type.
type spawnGroupSpec struct {
	// authored Tiled class shared by every creation spec in the group.
	Class  string
	Spawns []spawnSpec
	Props  []spawnPropSpec
}

// combines generic creation data with app-specific properties.
type spawnSpec struct {
	vboards.Spawn
	Props []spawnPropSpec
}

// stores one supported app-specific Tiled property.
type spawnPropSpec struct {
	Name string
	Type spawnPropType
	Bool bool
	XY   vgeo.XY[float32]
	Int  int32
}

func (this spawnPropSpec) IsBool() bool { return this.Type == spawnPropBool }
func (this spawnPropSpec) IsInt() bool  { return this.Type == spawnPropInt }
func (this spawnPropSpec) IsXY() bool   { return this.Type == spawnPropXY }

// identifies the Go representation emitted for an app-specific property.
type spawnPropType uint8

const (
	spawnPropBool spawnPropType = iota
	spawnPropInt
	spawnPropXY
)

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
	// point objects grouped by their Tiled class during parsing.
	ObjGroups []tmxObjectGroup `xml:"objectgroup"`
}

// map-local reference to an external TSX tileset.
type tmxTileset struct {
	// first global tile ID assigned to the referenced tileset.
	FirstGID uint32 `xml:"firstgid,attr"`
	// TMX-relative TSX path.
	Source string `xml:"source,attr"`
	// atlas mapping resolved from the external TSX image.
	manifest *tilesetmanifest.TilesetSpec
	// local tile ID to `hits` property.
	hits []bool
	// image-collection tilesets provide editor-only object representations.
	objOnly   bool
	tileCount uint32
	// default properties by local representation tile ID.
	objProps [][]tsxProp
}

// supported subset of an external TSX tileset.
type tsxTileset struct {
	// anchor used when placing tile objects.
	ObjAlignment string `xml:"objectalignment,attr"`
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
	Name     string    `xml:"name,attr"`
	Type     string    `xml:"type,attr"`
	PropType string    `xml:"propertytype,attr"`
	Value    string    `xml:"value,attr"`
	Props    []tsxProp `xml:"properties>property"`
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

type tmxObjectGroup struct {
	Objs []tmxObject `xml:"object"`
}

type tmxObject struct {
	ID      uint32    `xml:"id,attr"`
	GID     uint32    `xml:"gid,attr"`
	Class   string    `xml:"type,attr"`
	X       float32   `xml:"x,attr"`
	Y       float32   `xml:"y,attr"`
	W       float32   `xml:"width,attr"`
	H       float32   `xml:"height,attr"`
	Rot     float32   `xml:"rotation,attr"`
	Visible *bool     `xml:"visible,attr"`
	Point   *tmxPoint `xml:"point"`
	Props   []tsxProp `xml:"properties>property"`
}

type tmxPoint struct{}

func newTilesetIndex(
	tilesets []tilesetmanifest.TilesetSpec,
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

func readBoard(
	path string, tilesets tilesetIndex, tags map[string]vatlas.Tag,
) (spawnBoardSpec, error) {
	bin, err := os.ReadFile(path)
	if err != nil {
		return spawnBoardSpec{}, err
	}
	tmx := tmxMap{}
	if err := xml.Unmarshal(bin, &tmx); err != nil {
		return spawnBoardSpec{}, err
	}
	if tmx.Orientation != "orthogonal" || tmx.Infinite != 0 {
		return spawnBoardSpec{}, fmt.Errorf("only finite orthogonal maps are supported")
	}
	if tmx.W == 0 || tmx.H == 0 || tmx.TileW == 0 || tmx.TileH == 0 {
		return spawnBoardSpec{}, fmt.Errorf("invalid map or tile dimensions")
	}
	if len(tmx.Layers) != 1 {
		return spawnBoardSpec{}, fmt.Errorf(
			"got %d tile layers, want 1", len(tmx.Layers),
		)
	}
	layer := tmx.Layers[0]
	if layer.X != 0 || layer.Y != 0 || layer.W != tmx.W || layer.H != tmx.H {
		return spawnBoardSpec{}, fmt.Errorf("tile layer bounds differ from map")
	}
	for i := range tmx.Tilesets {
		if err := loadTileset(
			path, &tmx.Tilesets[i], tmx.TileW, tmx.TileH, tilesets,
		); err != nil {
			return spawnBoardSpec{}, err
		}
		if i != 0 && tmx.Tilesets[i-1].FirstGID >= tmx.Tilesets[i].FirstGID {
			return spawnBoardSpec{}, fmt.Errorf(
				"tilesets are not in increasing firstgid order",
			)
		}
	}
	if len(tmx.Tilesets) == 0 {
		return spawnBoardSpec{}, fmt.Errorf("map has no tileset")
	}
	gids, err := parseCSV(layer.Data)
	if err != nil {
		return spawnBoardSpec{}, err
	}
	total := uint64(tmx.W) * uint64(tmx.H)
	if total > uint64(^uint32(0)) {
		return spawnBoardSpec{}, fmt.Errorf("map tile count exceeds uint32")
	}
	if uint64(len(gids)) != total {
		return spawnBoardSpec{}, fmt.Errorf(
			"got %d tiles, want %d", len(gids), total,
		)
	}
	tiles := make([]vboards.Tile, len(gids))
	for i, gid := range gids {
		tile, err := tileForGID(gid, tmx.Tilesets)
		if err != nil {
			return spawnBoardSpec{}, fmt.Errorf("tile %d: %w", i, err)
		}
		tiles[i] = tile
	}
	w := uint64(tmx.W) * uint64(tmx.TileW)
	h := uint64(tmx.H) * uint64(tmx.TileH)
	if w > maxI32 || h > maxI32 {
		return spawnBoardSpec{}, fmt.Errorf("board dimensions exceed int32")
	}
	spawns, err := parseSpawns(tmx.ObjGroups, tmx.Tilesets, tags)
	if err != nil {
		return spawnBoardSpec{}, err
	}
	return spawnBoardSpec{
		Board: vboards.Board{
			WH:    vgeo.NewWH(int32(w), int32(h)),
			Tile:  vgeo.NewWH(tmx.TileW, tmx.TileH),
			Tiles: tiles,
		},
		Spawns: spawns,
	}, nil
}

func parseSpawns(
	groups []tmxObjectGroup,
	tilesets []tmxTileset,
	tags map[string]vatlas.Tag,
) ([]spawnGroupSpec, error) {
	var spawns []spawnGroupSpec
	classIndices := make(map[string]int)
	for _, group := range groups {
		for _, obj := range group.Objs {
			if obj.Class == "" {
				return nil, fmt.Errorf("object ID %d has no class", obj.ID)
			}
			if err := validateSpawnShape(&obj, tilesets); err != nil {
				return nil, err
			}
			if !vmath.Finite(obj.X) || !vmath.Finite(obj.Y) ||
				!vmath.Finite(obj.W) || !vmath.Finite(obj.H) ||
				!vmath.Finite(obj.Rot) {
				return nil, fmt.Errorf(
					"object ID %d class %q has non-finite transform",
					obj.ID, obj.Class,
				)
			}
			rot := obj.Rot * tiledDegToRot
			if rot == 0 {
				rot = 0
			}
			defaults := spawnDefaultProps(&obj, tilesets)
			rawProps := mergeTSXProps(defaults, obj.Props)
			baseSpawn := vboards.NewSpawn(
				obj.X, obj.Y, obj.W, obj.H, rot,
			)
			appProps, err := parseGenericSpawnProps(
				&obj, &baseSpawn, rawProps, tags,
			)
			if err != nil {
				return nil, err
			}
			props, err := parseSpawnProps(obj.ID, appProps)
			if err != nil {
				return nil, err
			}
			groupIndex, ok := classIndices[obj.Class]
			if !ok {
				groupIndex = len(spawns)
				classIndices[obj.Class] = groupIndex
				spawns = append(
					spawns, spawnGroupSpec{Class: obj.Class},
				)
			}
			if err := mergeSpawnProps(&spawns[groupIndex], props); err != nil {
				return nil, fmt.Errorf("object ID %d: %w", obj.ID, err)
			}
			spawns[groupIndex].Spawns = append(
				spawns[groupIndex].Spawns,
				spawnSpec{Spawn: baseSpawn, Props: props},
			)
		}
	}
	return spawns, nil
}

func validateSpawnShape(obj *tmxObject, tilesets []tmxTileset) error {
	if obj.Point != nil {
		if obj.GID != 0 {
			return fmt.Errorf("object ID %d is both a point and tile", obj.ID)
		}
		if obj.W != 0 || obj.H != 0 {
			return fmt.Errorf("point object ID %d has nonzero size", obj.ID)
		}
		return nil
	}
	gid := obj.GID &^ tiledFlipMask
	if gid == 0 || obj.GID&tiledBadSpawnFlipMask != 0 {
		return fmt.Errorf(
			"object ID %d must be a point or non-diagonally-flipped tile",
			obj.ID,
		)
	}
	tileset := &tilesets[0]
	for i := 1; i < len(tilesets) && tilesets[i].FirstGID <= gid; i++ {
		tileset = &tilesets[i]
	}
	localID := gid - tileset.FirstGID
	if !tileset.objOnly || localID >= tileset.tileCount {
		return fmt.Errorf("object ID %d has invalid representation tile", obj.ID)
	}
	if obj.W <= 0 || obj.H <= 0 {
		return fmt.Errorf(
			"object ID %d has non-positive size (%g, %g)",
			obj.ID, obj.W, obj.H,
		)
	}
	return nil
}

func spawnDefaultProps(
	obj *tmxObject,
	tilesets []tmxTileset,
) []tsxProp {
	if obj.GID == 0 {
		return nil
	}
	gid := obj.GID &^ tiledFlipMask
	tileset := &tilesets[0]
	for i := 1; i < len(tilesets) && tilesets[i].FirstGID <= gid; i++ {
		tileset = &tilesets[i]
	}
	return tileset.objProps[gid-tileset.FirstGID]
}

func mergeTSXProps(defaults, overrides []tsxProp) []tsxProp {
	if len(defaults) == 0 {
		return overrides
	}
	this := append([]tsxProp(nil), defaults...)
	for _, override := range overrides {
		found := false
		for i := range this {
			if this[i].Name == override.Name {
				this[i] = override
				found = true
				break
			}
		}
		if !found {
			this = append(this, override)
		}
	}
	return this
}

func parseGenericSpawnProps(
	obj *tmxObject,
	spawn *vboards.Spawn,
	props []tsxProp,
	tags map[string]vatlas.Tag,
) ([]tsxProp, error) {
	spawn.Hidden = obj.Visible != nil && !*obj.Visible
	spawn.FlipX = obj.GID&tiledFlipXMask != 0
	spawn.FlipY = obj.GID&tiledFlipYMask != 0
	layer, sublayer := uint64(0), uint64(0)
	appProps := make([]tsxProp, 0, len(props))
	for _, prop := range props {
		switch prop.Name {
		case "Stretch", "ZTop":
			val, err := strconv.ParseBool(prop.Value)
			if err != nil || prop.Type != "bool" {
				return nil, fmt.Errorf(
					"object ID %d prop %q has invalid bool",
					obj.ID, prop.Name,
				)
			}
			if prop.Name == "Stretch" {
				spawn.Stretch = val
			} else {
				spawn.ZTop = val
			}
		case "Tag":
			tag, ok := tags[prop.Value]
			if prop.Type != "" && prop.Type != "string" || !ok {
				return nil, fmt.Errorf(
					"object ID %d prop %q must name a packed atlas tag",
					obj.ID, prop.Name,
				)
			}
			spawn.Tag = tag
		case "Cel":
			val, err := strconv.ParseUint(prop.Value, 10, 8)
			if err != nil || prop.Type != "int" ||
				prop.PropType != "Cel" || val > uint64(vatlas.TagCelMask) {
				return nil, fmt.Errorf(
					"object ID %d prop %q must use the Cel enum from 0 to %d",
					obj.ID, prop.Name, vatlas.TagCelMask,
				)
			}
			spawn.Cel = uint8(val)
		case "Pal":
			val, err := strconv.ParseUint(prop.Value, 10, 8)
			if err != nil || prop.Type != "int" ||
				prop.PropType != "Pal" {
				return nil, fmt.Errorf(
					"object ID %d prop %q must use the Pal enum from 0 to %d",
					obj.ID, prop.Name, vgfx.SprPalMax,
				)
			}
			spawn.Pal = vatlas.Tag(val)
		case "Layer", "Z":
			val, err := strconv.ParseUint(prop.Value, 10, 8)
			count := uint64(vgfx.LayerCount)
			if prop.Name == "Z" {
				count = uint64(vgfx.SublayerCount)
			}
			if err != nil || prop.Type != "int" ||
				prop.PropType != prop.Name || val >= count {
				return nil, fmt.Errorf(
					"object ID %d prop %q must use the %s enum from 0 to %d",
					obj.ID, prop.Name, prop.Name, count-1,
				)
			}
			if prop.Name == "Layer" {
				layer = val
			} else {
				sublayer = val
			}
		default:
			appProps = append(appProps, prop)
		}
	}
	spawn.Z = vgfx.Layer(layer).Z(vgfx.Sublayer(sublayer))
	return appProps, nil
}

func parseSpawnProps(id uint32, props []tsxProp) ([]spawnPropSpec, error) {
	if len(props) == 0 {
		return nil, nil
	}
	this := make([]spawnPropSpec, 0, len(props))
	for _, prop := range props {
		if prop.Name == "" {
			return nil, fmt.Errorf("object ID %d has unnamed prop", id)
		}
		for _, other := range this {
			if other.Name == prop.Name {
				return nil, fmt.Errorf(
					"object ID %d has duplicate prop %q", id, prop.Name,
				)
			}
		}
		v := spawnPropSpec{Name: prop.Name}
		switch {
		case prop.Type == "bool":
			boolVal, err := strconv.ParseBool(prop.Value)
			if err != nil {
				return nil, fmt.Errorf(
					"object ID %d prop %q has invalid bool", id, prop.Name,
				)
			}
			v.Type = spawnPropBool
			v.Bool = boolVal
		case prop.Type == "int":
			intVal, err := strconv.ParseInt(prop.Value, 10, 32)
			if err != nil {
				return nil, fmt.Errorf(
					"object ID %d prop %q has invalid int", id, prop.Name,
				)
			}
			v.Type = spawnPropInt
			v.Int = int32(intVal)
		case prop.Type == "class" && prop.PropType == "XY":
			xy, err := parseSpawnXY(id, &prop)
			if err != nil {
				return nil, err
			}
			v.Type = spawnPropXY
			v.XY = xy
		default:
			return nil, fmt.Errorf(
				"object ID %d prop %q has unsupported type", id, prop.Name,
			)
		}
		this = append(this, v)
	}
	return this, nil
}

func parseSpawnXY(id uint32, prop *tsxProp) (vgeo.XY[float32], error) {
	this := vgeo.XY[float32]{}
	seenX, seenY := false, false
	for _, component := range prop.Props {
		val, err := strconv.ParseFloat(component.Value, 32)
		if err != nil || component.Type != "float" || !vmath.Finite(float32(val)) {
			return this, fmt.Errorf(
				"object ID %d prop %q has invalid XY", id, prop.Name,
			)
		}
		switch component.Name {
		case "X":
			if seenX {
				return this, fmt.Errorf(
					"object ID %d prop %q has duplicate X", id, prop.Name,
				)
			}
			this.X, seenX = float32(val), true
		case "Y":
			if seenY {
				return this, fmt.Errorf(
					"object ID %d prop %q has duplicate Y", id, prop.Name,
				)
			}
			this.Y, seenY = float32(val), true
		default:
			return this, fmt.Errorf(
				"object ID %d prop %q has invalid XY", id, prop.Name,
			)
		}
	}
	return this, nil
}

func mergeSpawnProps(group *spawnGroupSpec, props []spawnPropSpec) error {
	for _, prop := range props {
		found := false
		for _, schema := range group.Props {
			if schema.Name != prop.Name {
				continue
			}
			if schema.Type != prop.Type {
				return fmt.Errorf("prop %q changes type within class", prop.Name)
			}
			found = true
			break
		}
		if !found {
			group.Props = append(group.Props, spawnPropSpec{
				Name: prop.Name, Type: prop.Type,
			})
		}
	}
	return nil
}

// resolves a Tiled global tile ID to its final packed tile.
func tileForGID(gid uint32, tilesets []tmxTileset) (vboards.Tile, error) {
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
	if tileset.objOnly {
		return 0, fmt.Errorf("GID %d references an object-only tileset", gid)
	}
	// Tiled GID -> preview canvas cell -> Aseprite native tile -> final tag.
	// adjacent preview cells may resolve to non-contiguous tags.
	localID := gid - tileset.FirstGID
	if localID >= uint32(len(tileset.manifest.Tags)) {
		return 0,
			fmt.Errorf("GID %d local ID %d is out of range of tags", gid, localID)
	}
	hits := tileset.hits[localID]
	return vboards.NewTile(tileset.manifest.Tags[localID], hits), nil
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
	if this.Image.Source == "" {
		if this.TileCount == 0 || this.ObjAlignment != "topleft" {
			return fmt.Errorf(
				"image-collection tilesets require tiles and top-left object alignment",
			)
		}
		ref.objOnly = true
		ref.tileCount = this.TileCount
		ref.objProps = make([][]tsxProp, this.TileCount)
		for _, tile := range this.Tiles {
			if tile.ID >= this.TileCount {
				return fmt.Errorf(
					"image-collection tile ID %d is out of range", tile.ID,
				)
			}
			ref.objProps[tile.ID] = tile.Props
		}
		return nil
	}

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
