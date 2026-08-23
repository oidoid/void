package tilesetmanifest

import "github.com/oidoid/void/src/void/vatlas"

// an atlas-backed Tiled tileset sourced from an Aseprite file. Tiled displays
// the rendered Aseprite canvas as a grid of preview cells. the preview supplies
// this path, dimensions, and cell order, but the tile pipeline does not copy
// its pixels into the atlas as tiles: packatlas extracts each embedded native
// tile image instead. the generic sprite pipeline may still pack the rendered
// Aseprite frame independently. `Anims` maps each preview cell to its final
// packed native-tile animation ID. native tiles cannot animate, so every
// referenced atlas animation has one cel.
type TilesetManifest struct {
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
	// indexes final atlas animation IDs by row-major preview canvas cell after
	// resolving the Aseprite native tile stored in each cell. adjacent cells
	// need not map to contiguous or increasing IDs; eg, `[164, 163, 168]` maps
	// preview cells 0, 1, and 2 to atlas animation IDs 164, 163, and 168. every
	// ID references one cel.
	Anims []vatlas.AnimID `json:"anims"`
}
