package main

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestReadBoard(t *testing.T) {
	dir := t.TempDir()
	image := filepath.Join(dir, "tiles.aseprite")
	tsx := filepath.Join(dir, "tiles.tsx")
	tmx := filepath.Join(dir, "test.tmx")
	writeTestFile(t, tsx, `<?xml version="1.0"?>
<tileset tilewidth="16" tileheight="16" tilecount="2" columns="2">
 <image source="tiles.aseprite" width="32" height="16"/>
 <tile id="1">
  <properties>
   <property name="hits" type="bool" value="true"/>
  </properties>
 </tile>
</tileset>`)
	writeTestFile(t, tmx, `<?xml version="1.0"?>
<map orientation="orthogonal" width="2" height="2" tilewidth="16"
 tileheight="16" infinite="0">
 <objectgroup>
  <object id="1" type="Superball" x="4.5" y="8.25" rotation="90"><point/>
   <properties><property name="Vel" type="class" propertytype="XY">
    <properties>
     <property name="X" type="float" value="1.5"/>
     <property name="Y" type="float" value="-2"/>
    </properties>
   </property>
   <property name="Enabled" type="bool" value="true"/>
   </properties>
  </object>
  <object id="2" type="Superball" x="12" y="16"><point/></object>
 </objectgroup>
 <tileset firstgid="1" source="tiles.tsx"/>
 <layer width="2" height="2"><data encoding="csv">1,2,0,1</data></layer>
</map>`)
	tilesets := []tilesetmanifest.TilesetSpec{{
		Path: image, W: 32, H: 16, TileW: 16, TileH: 16,
		Tags: []vatlas.Tag{9, 10},
	}}
	index, err := newTilesetIndex(tilesets)
	if err != nil {
		t.Fatal(err)
	}
	got, err := readBoard(tmx, index, nil)
	if err != nil {
		t.Fatal(err)
	}
	if got.W != 32 || got.H != 32 ||
		got.Tile.W != 16 || got.Tile.H != 16 {
		t.Fatalf("board dimensions = %#v", got)
	}
	want := []vboards.Tile{
		vboards.NewTile(9, false), vboards.NewTile(10, true), 0,
		vboards.NewTile(9, false),
	}
	if !reflect.DeepEqual(got.Tiles, want) {
		t.Fatalf("tiles = %v, want %v", got.Tiles, want)
	}
	wantSpawns := []spawnGroupSpec{{
		Class: "Superball",
		Props: []spawnPropSpec{
			{Name: "Vel", Type: spawnPropXY},
			{Name: "Enabled", Type: spawnPropBool},
		},
		Spawns: []spawnSpec{
			{
				Spawn: vboards.NewSpawn(
					4.5, 8.25, 0, 0, 90*tiledDegToRot,
				),
				Props: []spawnPropSpec{
					{
						Name: "Vel", Type: spawnPropXY,
						XY: vgeo.NewXY[float32](1.5, -2),
					},
					{Name: "Enabled", Type: spawnPropBool, Bool: true},
				},
			},
			{
				Spawn: vboards.NewSpawn(12, 16, 0, 0, 0),
			},
		},
	}}
	if !reflect.DeepEqual(got.Spawns, wantSpawns) {
		t.Fatalf("spawns = %v, want %v", got.Spawns, wantSpawns)
	}
}

func TestParseSpawns(t *testing.T) {
	cases := map[string]struct {
		in  tmxObject
		err bool
	}{
		"type": {tmxObject{
			ID: 1, Class: "item", X: 1, Y: 2, Point: new(tmxPoint),
		}, false},
		"missing class": {tmxObject{ID: 1, Point: new(tmxPoint)}, true},
		"shape":         {tmxObject{ID: 1, Class: "item"}, true},
		"props": {tmxObject{
			ID: 1, Class: "item", Point: new(tmxPoint),
			Props: []tsxProp{{Name: "vel"}},
		}, true},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			_, err := parseSpawns([]tmxObjectGroup{{Objs: []tmxObject{
				test.in,
			}}}, nil, nil)
			if (err != nil) != test.err {
				t.Fatalf("err = %v, want error %t", err, test.err)
			}
		})
	}
}

func TestParseAppSpawnEnumProp(t *testing.T) {
	got, err := parseSpawnProps(1, []tsxProp{
		{Name: "Mode", Type: "int", PropType: "Mode", Value: "2"},
	})
	if err != nil {
		t.Fatal(err)
	}
	want := []spawnPropSpec{{Name: "Mode", Type: spawnPropInt, Int: 2}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("props = %#v, want %#v", got, want)
	}
}

func TestParseGenericSpawnProps(t *testing.T) {
	visible := false
	object := tmxObject{
		ID: 1, GID: 1 | tiledFlipXMask | tiledFlipYMask, Visible: &visible,
	}
	var got vboards.Spawn
	appProps, err := parseGenericSpawnProps(&object, &got, []tsxProp{
		{Name: "Stretch", Type: "bool", Value: "true"},
		{Name: "Cel", Type: "int", PropType: "Cel", Value: "15"},
		{Name: "Tag", Type: "string", PropType: "Tag", Value: "SuperballDefault"},
		{Name: "Pal", Type: "int", PropType: "Pal", Value: "7"},
		{Name: "Layer", Type: "int", PropType: "Layer", Value: "2"},
		{Name: "Z", Type: "int", PropType: "Z", Value: "15"},
		{Name: "ZTop", Type: "bool", Value: "true"},
		{Name: "Game", Type: "bool", Value: "true"},
	}, map[string]vatlas.Tag{"SuperballDefault": 9})
	if err != nil {
		t.Fatal(err)
	}
	if !got.Hidden || !got.FlipX || !got.FlipY ||
		!got.Stretch || got.Tag != 9 || got.Cel != 15 || got.Pal != 7 || got.Z != vgfx.Layer(2).Z(15) ||
		!got.ZTop {
		t.Fatalf("spawn props = %#v", got)
	}
	want := []tsxProp{{Name: "Game", Type: "bool", Value: "true"}}
	if !reflect.DeepEqual(appProps, want) {
		t.Fatalf("app props = %#v, want %#v", appProps, want)
	}
}

func TestParseGenericSpawnZRejectsInvalid(t *testing.T) {
	cases := map[string]tsxProp{
		"layer range": {
			Name: "Layer", Type: "int", PropType: "Layer", Value: "8",
		},
		"sublayer range": {
			Name: "Z", Type: "int", PropType: "Z", Value: "16",
		},
		"cel range": {
			Name: "Cel", Type: "int", PropType: "Cel", Value: "16",
		},
		"layer enum":    {Name: "Layer", Type: "int", Value: "2"},
		"sublayer enum": {Name: "Z", Type: "int", Value: "3"},
		"cel enum":      {Name: "Cel", Type: "int", Value: "1"},
		"pal enum":      {Name: "Pal", Type: "int", Value: "1"},
		"tag type":      {Name: "Tag", Type: "int", Value: "1"},
		"tag unknown":   {Name: "Tag", Value: "Missing"},
	}
	for name, prop := range cases {
		t.Run(name, func(t *testing.T) {
			object := tmxObject{ID: 1}
			var spawn vboards.Spawn
			if _, err := parseGenericSpawnProps(
				&object, &spawn, []tsxProp{prop},
				nil,
			); err == nil {
				t.Fatal("want invalid generic Z prop error")
			}
		})
	}
}

func TestParseSpawnsPreservesResizedTileWH(t *testing.T) {
	tilesets := []tmxTileset{{
		FirstGID: 1, objOnly: true, tileCount: 1,
		objProps: make([][]tsxProp, 1),
	}}
	got, err := parseSpawns([]tmxObjectGroup{{Objs: []tmxObject{{
		ID: 1, GID: 1 | tiledFlipXMask, Class: "Superball", W: 32, H: 24,
	}}}}, tilesets, nil)
	if err != nil {
		t.Fatal(err)
	}
	want := vgeo.NewWH[float32](32, 24)
	if got[0].Spawns[0].WH != want {
		t.Fatalf("WH = %v, want %v", got[0].Spawns[0].WH, want)
	}
	if !got[0].Spawns[0].FlipX {
		t.Fatal("FlipX = false, want true")
	}
}

func TestMergeTSXProps(t *testing.T) {
	defaults := []tsxProp{
		{Name: "Enabled", Type: "bool", Value: "false"},
		{Name: "Vel", Type: "class", PropType: "XY"},
	}
	overrides := []tsxProp{
		{Name: "Enabled", Type: "bool", Value: "true"},
		{Name: "Health", Type: "int", Value: "3"},
	}
	want := []tsxProp{
		{Name: "Enabled", Type: "bool", Value: "true"},
		{Name: "Vel", Type: "class", PropType: "XY"},
		{Name: "Health", Type: "int", Value: "3"},
	}
	if got := mergeTSXProps(defaults, overrides); !reflect.DeepEqual(got, want) {
		t.Fatalf("props = %#v, want %#v", got, want)
	}
}

func TestGenBoardSpawns(t *testing.T) {
	board := spawnBoardSpec{
		Board: vboards.Board{
			WH: vgeo.NewWH[int32](16, 16), Tile: vgeo.NewWH[uint8](16, 16),
			Tiles: []vboards.Tile{0},
		},
		Spawns: []spawnGroupSpec{{
			Class: "Superball",
			Props: []spawnPropSpec{
				{Name: "Vel", Type: spawnPropXY},
				{Name: "Enabled", Type: spawnPropBool},
			},
			Spawns: []spawnSpec{{
				Spawn: vboards.Spawn{
					XY: vgeo.NewXY[float32](4.5, 8.25),
					WH: vgeo.NewWH[float32](8, 8), Rot: -1.5,
					Z: vgfx.Layer(2).Z(3), Tag: 9, Cel: 15, Pal: 7,
					Hidden: true, FlipX: true, Stretch: true, ZTop: true,
				},
				Props: []spawnPropSpec{
					{
						Name: "Vel", Type: spawnPropXY,
						XY: vgeo.NewXY[float32](1, -2),
					},
					{Name: "Enabled", Type: spawnPropBool, Bool: true},
				},
			}, {
				Props: []spawnPropSpec{
					{Name: "Vel", Type: spawnPropXY},
					{Name: "Enabled", Type: spawnPropBool},
				},
			},
			}}},
	}
	src, err := genBoard("maps", "init.tmx", &board)
	if err != nil {
		t.Fatal(err)
	}
	want := `type InitSuperballSpawn struct {
	vboards.Spawn
	Vel     vgeo.XY[float32]
	Enabled bool
}

var InitSuperballSpawns = [...]InitSuperballSpawn{
	{
		Spawn: vboards.Spawn{
			XY:      vgeo.NewXY[float32](4.5, 8.25),
			WH:      vgeo.NewWH[float32](8, 8),
			Rot:     -1.5,
			Z:       35,
			Tag:     9,
			Cel:     15,
			Pal:     7,
			Hidden:  true,
			FlipX:   true,
			Stretch: true,
			ZTop:    true,
		},
		Vel:     vgeo.NewXY[float32](1, -2),
		Enabled: true,
	},
	{
		Spawn: vboards.Spawn{},
	},
}`
	if !strings.Contains(string(src), want) {
		t.Fatalf("generated source lacks %q:\n%s", want, src)
	}
}

func TestGenBoardRejectsSpawnNameCollision(t *testing.T) {
	board := spawnBoardSpec{Spawns: []spawnGroupSpec{
		{Class: "super-ball"}, {Class: "super_ball"},
	}}
	if _, err := genBoard("maps", "init.tmx", &board); err == nil {
		t.Fatal("want object class collision error")
	}
}

func TestReadBoardRejectsLargeTile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "large-tile.tmx")
	writeTestFile(t, path, `<?xml version="1.0"?>
<map orientation="orthogonal" width="1" height="1" tilewidth="256"
 tileheight="1" infinite="0">
 <layer width="1" height="1"><data encoding="csv">0</data></layer>
</map>`)
	if _, err := readBoard(path, nil, nil); err == nil {
		t.Fatal("want uint8 tile-dimension error")
	}
}

func TestTileForGID(t *testing.T) {
	first := tilesetmanifest.TilesetSpec{
		Tags: []vatlas.Tag{9, 10},
	}
	second := tilesetmanifest.TilesetSpec{
		Tags: []vatlas.Tag{20, 21},
	}
	tilesets := []tmxTileset{
		{FirstGID: 1, manifest: &first, hits: []bool{false, true}},
		{FirstGID: 10, manifest: &second, hits: []bool{true, false}},
	}
	cases := map[string]struct {
		gid  uint32
		want vboards.Tile
		err  bool
	}{
		"empty":        {0, 0, false},
		"first":        {1, vboards.NewTile(9, false), false},
		"next":         {2, vboards.NewTile(10, true), false},
		"second":       {10, vboards.NewTile(20, true), false},
		"gap":          {3, 0, true},
		"out of range": {12, 0, true},
		"flip":         {tiledFlipMask | 1, 0, true},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := tileForGID(test.gid, tilesets)
			if (err != nil) != test.err {
				t.Fatalf("err = %v, want error %t", err, test.err)
			}
			if got != test.want {
				t.Fatalf("tile = %d, want %d", got, test.want)
			}
		})
	}
}

func TestParseTileHits(t *testing.T) {
	cases := map[string]struct {
		in   tsxTileset
		want []bool
		err  bool
	}{
		"true": {
			tsxTileset{
				TileCount: 2,
				Tiles: []tsxTile{{
					ID: 1,
					Props: []tsxProp{
						{Name: "ignored", Type: "string", Value: "x"},
						{Name: "hits", Type: "bool", Value: "true"},
					},
				}},
			},
			[]bool{false, true},
			false,
		},
		"false default": {
			tsxTileset{
				TileCount: 1,
				Tiles: []tsxTile{{
					Props: []tsxProp{{Name: "hits", Type: "bool"}},
				}},
			},
			[]bool{false},
			false,
		},
		"type": {
			tsxTileset{
				TileCount: 1,
				Tiles: []tsxTile{{
					Props: []tsxProp{{Name: "hits", Type: "string"}},
				}},
			},
			nil,
			true,
		},
		"value": {
			tsxTileset{
				TileCount: 1,
				Tiles: []tsxTile{{
					Props: []tsxProp{{
						Name: "hits", Type: "bool", Value: "yes",
					}},
				}},
			},
			nil,
			true,
		},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := parseTileHits(&test.in)
			if (err != nil) != test.err {
				t.Fatalf("err = %v, want error %t", err, test.err)
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("hits = %v, want %v", got, test.want)
			}
		})
	}
}

func TestParseCSV(t *testing.T) {
	cases := map[string]struct {
		in   tmxData
		want []uint32
		err  bool
	}{
		"csv":      {tmxData{Encoding: "csv", CSV: "1, 2,\n0,"}, []uint32{1, 2, 0}, false},
		"encoding": {tmxData{Encoding: "base64"}, nil, true},
		"value":    {tmxData{Encoding: "csv", CSV: "x"}, nil, true},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := parseCSV(test.in)
			if (err != nil) != test.err {
				t.Fatalf("err = %v, want error %t", err, test.err)
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("GIDs = %v, want %v", got, test.want)
			}
		})
	}
}

func writeTestFile(t *testing.T, path, data string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(data), 0o644); err != nil {
		t.Fatal(err)
	}
}
