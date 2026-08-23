package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vatlas"
)

func TestReadLevel(t *testing.T) {
	dir := t.TempDir()
	image := filepath.Join(dir, "tiles.aseprite")
	tsx := filepath.Join(dir, "tiles.tsx")
	tmx := filepath.Join(dir, "test.tmx")
	writeTestFile(t, tsx, `<?xml version="1.0"?>
<tileset tilewidth="16" tileheight="16" tilecount="2" columns="2">
 <image source="tiles.aseprite" width="32" height="16"/>
</tileset>`)
	writeTestFile(t, tmx, `<?xml version="1.0"?>
<map orientation="orthogonal" width="2" height="2" tilewidth="16"
 tileheight="16" infinite="0">
 <tileset firstgid="1" source="tiles.tsx"/>
 <layer width="2" height="2"><data encoding="csv">1,2,0,1</data></layer>
</map>`)
	tilesets := []tilesetmanifest.TilesetManifest{{
		Path: image, W: 32, H: 16, TileW: 16, TileH: 16,
		Tags: []vatlas.Tag{9, 10},
	}}
	index, err := newTilesetIndex(tilesets)
	if err != nil {
		t.Fatal(err)
	}
	got, err := readLevel(tmx, index)
	if err != nil {
		t.Fatal(err)
	}
	if got.W != 32 || got.H != 32 ||
		got.Tile.W != 16 || got.Tile.H != 16 {
		t.Fatalf("level dimensions = %#v", got)
	}
	want := []vatlas.Tag{9, 10, 0, 9}
	if !reflect.DeepEqual(got.Tiles, want) {
		t.Fatalf("tiles = %v, want %v", got.Tiles, want)
	}
}

func TestReadLevelRejectsLargeTile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "large-tile.tmx")
	writeTestFile(t, path, `<?xml version="1.0"?>
<map orientation="orthogonal" width="1" height="1" tilewidth="256"
 tileheight="1" infinite="0">
 <layer width="1" height="1"><data encoding="csv">0</data></layer>
</map>`)
	if _, err := readLevel(path, nil); err == nil {
		t.Fatal("want uint8 tile-dimension error")
	}
}

func TestTagForGID(t *testing.T) {
	first := tilesetmanifest.TilesetManifest{
		Tags: []vatlas.Tag{9, 10},
	}
	second := tilesetmanifest.TilesetManifest{
		Tags: []vatlas.Tag{20, 21},
	}
	tilesets := []tmxTileset{
		{FirstGID: 1, manifest: &first},
		{FirstGID: 10, manifest: &second},
	}
	cases := map[string]struct {
		gid  uint32
		want vatlas.Tag
		err  bool
	}{
		"empty":        {0, 0, false},
		"first":        {1, 9, false},
		"next":         {2, 10, false},
		"second":       {10, 20, false},
		"gap":          {3, 0, true},
		"out of range": {12, 0, true},
		"flip":         {tiledFlipMask | 1, 0, true},
	}
	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := tagForGID(test.gid, tilesets)
			if (err != nil) != test.err {
				t.Fatalf("err = %v, want error %t", err, test.err)
			}
			if got != test.want {
				t.Fatalf("Tag = %d, want %d", got, test.want)
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
