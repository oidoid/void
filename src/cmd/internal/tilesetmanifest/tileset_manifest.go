package tilesetmanifest

import "github.com/oidoid/void/src/void/vatlas"

// build-time atlas metadata shared by packatlas and packboards.
type TilesetManifestSpec struct {
	Tags     map[string]vatlas.Tag `json:"tags"`
	Tilesets []TilesetSpec         `json:"tilesets"`
}

// an atlas-backed Tiled tileset sourced from an Aseprite file. Tiled displays
// the rendered Aseprite canvas as a grid of preview cells. the preview supplies
// this path, dimensions, and cell order, but the tile pipeline does not copy
// its pixels into the atlas as tiles: packatlas extracts each embedded native
// tile image instead. the generic sprite pipeline may still pack the rendered
// Aseprite frame independently. `Tags` maps each preview cell to its final
// packed native-tile tag. native tiles cannot animate, so every
// referenced atlas animation has one cel.
type TilesetSpec struct {
	// normalized Aseprite path matched against the TSX image path.
	Path string `json:"path"`
	// rendered preview canvas width in pixels.
	W uint16 `json:"w"`
	// rendered preview canvas height in pixels.
	H uint16 `json:"h"`
	// native tileset cell width in pixels.
	TileW uint8 `json:"tileW"`
	// native tileset cell height in pixels.
	TileH uint8 `json:"tileH"`
	// indexes final tags by row-major preview canvas cell after resolving the
	// Aseprite native tile stored in each cell. adjacent cells need not map to
	// contiguous or increasing tags; eg, `[164, 163, 168]` maps preview cells
	// 0, 1, and 2 to tags 164, 163, and 168. every tag references one cel.
	Tags []vatlas.Tag `json:"tags"`
}
