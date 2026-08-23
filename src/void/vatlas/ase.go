package vatlas

// https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md

type AseColorDepth uint16
type AseLayerType uint16
type AseCelType uint16
type AseTilesetFlags uint32

const (
	AseFileMagic       uint16        = 0xa5e0
	AseFrameMagic      uint16        = 0xf1fa
	AseChunkHeaderSize uint32        = 6
	AseColorIndexed    AseColorDepth = 8
	AseColorGrayscale  AseColorDepth = 16
	AseColorRGBA       AseColorDepth = 32

	AseHeaderLayerUUIDMask   uint32          = 1
	AseHeaderLayerUUIDShift                  = 2
	AseLayerVisibleMask      uint16          = 1
	AseLayerVisibleShift                     = 0
	AseLayerNormal           AseLayerType    = 0
	AseLayerGroup            AseLayerType    = 1
	AseLayerTilemap          AseLayerType    = 2
	AseCelRaw                AseCelType      = 0
	AseCelLinked             AseCelType      = 1
	AseCelCompressed         AseCelType      = 2
	AseCelTilemap            AseCelType      = 3
	AsePalEntryNameMask      uint16          = 1
	AsePalEntryNameShift                     = 0
	AseOldPalColorsMax                       = 256
	AseSliceNinePatchMask    uint32          = 1
	AseSliceNinePatchShift                   = 0
	AseSlicePivotMask        uint32          = 1
	AseSlicePivotShift                       = 1
	AseUserDataTextMask      uint32          = 1
	AseUserDataTextShift                     = 0
	AseUserDataColorMask     uint32          = 1
	AseUserDataColorShift                    = 1
	AseUserDataPropsMask     uint32          = 1
	AseUserDataPropsShift                    = 2
	AseTilesetExternalMask   AseTilesetFlags = 1
	AseTilesetExternalShift                  = 0
	AseTilesetEmbeddedMask   AseTilesetFlags = 1
	AseTilesetEmbeddedShift                  = 1
	AseTilesetZeroEmptyMask  AseTilesetFlags = 1
	AseTilesetZeroEmptyShift                 = 2
)

// .aseprite binary model.
type Ase struct {
	Header AseHeader
	Frames []AseFrame
}

type AseHeader struct {
	Size       uint32 // file size in bytes.
	Magic      uint16 // xa5e0.
	FrameCount uint16
	W, H       uint16 // spr dimensions in pixels.
	// `8` indexed, `16` grayscale, or `32` RGBA bits per pixel.
	ColorDepth       AseColorDepth
	Flags            uint32
	_                uint16
	_                [8]byte
	TransparentIndex uint8 // transparent indexed-color entry.
	_                [3]byte
	ColorCount       uint16
	PxW, PxH         uint8  // pixel ratio.
	GridX, GridY     int16  // grid origin.
	GridW, GridH     uint16 // grid dimensions; 0 disables the grid.
	_                [84]byte
}

type AseFrame struct {
	Header AseFrameHeader
	Chunks []AseChunk
}

type AseFrameHeader struct {
	Size       uint32 // frame size in bytes.
	Magic      uint16 // xf1fa.
	_          uint16
	Millis     uint16
	_          [2]byte
	ChunkCount uint32
}

type AseChunkHeader struct {
	Size uint32 // chunk size in bytes
	Type AseChunkType
}

type AseChunkType uint16

const (
	// Aseprite uses old palette chunks for some palettes despite the name.
	AseChunkOldPal   AseChunkType = 0x0004
	AseChunkLayer    AseChunkType = 0x2004
	AseChunkCel      AseChunkType = 0x2005
	AseChunkTags     AseChunkType = 0x2018
	AseChunkPal      AseChunkType = 0x2019
	AseChunkUserData AseChunkType = 0x2020
	AseChunkSlice    AseChunkType = 0x2022
	AseChunkTileset  AseChunkType = 0x2023
)

type AseChunk struct {
	Header   AseChunkHeader
	Layer    *AseLayer
	Cel      *AseCel
	Tags     *AseTags
	OldPal   *AseOldPal
	Pal      *AsePal
	UserData *AseUserData
	Slice    *AseSlice
	Tileset  *AseTileset
}

type AseLayerHeader struct {
	Flags   uint16
	Type    AseLayerType // normal image, group, or tilemap.
	Level   uint16       // child level in the layer hierarchy.
	_, _    uint16
	Blend   uint16 // blend-mode index.
	Opacity uint8
	_       [3]byte
}

type AseCelHeader struct {
	Layer   uint16     // layer index.
	X, Y    int16      // position in the spr.
	Opacity uint8      // cel opacity.
	Type    AseCelType // raw image, linked cel, compressed image, or tilemap.
	ZIndex  int16      // relative layer ordering.
	_       [5]byte
}

type AseCelImageHeader struct {
	W, H uint16 // image dimensions in pixels.
}

type AseCelTilemapHeader struct {
	W, H             uint16
	Bits             uint16
	ID, XFlip, YFlip uint32
	DiagonalFlip     uint32
	_                [10]byte
}

type AseTagsHeader struct {
	Count uint16 // number of tag records.
	_     [8]byte
}

type AseTagSpanHeader struct {
	From, To  uint16   // inclusive frame range.
	Direction AseDir   // loop direction.
	Repeat    uint16   // repetitions; 0 is unspecified.
	_         [10]byte // reserved and deprecated tag color.
}

type AsePalHeader struct {
	Count    uint32 // number of entries.
	From, To uint32 // inclusive color changed range.
	_        [8]byte
}

type AsePalEntryHeader struct {
	Flags uint16
	RGBA  AseRGBA
}

type AsePalEntry struct {
	Header AsePalEntryHeader
	Name   string
}

type AseOldPalHeader struct {
	Count uint16 // number of palette packets.
}

type AseOldPalPacketHeader struct {
	Skip  uint8 // skipped entries from the last packet.
	Count uint8 // color count; 0 means 256.
}

type AseOldPalPacket struct {
	Header AseOldPalPacketHeader
	RGBs   []AseRGB
}

type AseSliceHeader struct {
	KeyCount uint32 // number of slice keys.
	Flags    uint32
	_        [4]byte
}

type AseUserDataHeader struct {
	Flags uint32
}

type AseTilesetHeader struct {
	ID        uint32
	Flags     AseTilesetFlags
	Count     uint32
	W, H      uint16 // tile dimensions in pixels.
	BaseIndex int16  // display-only tile index offset.
	_         [14]byte
}

type AseTilesetExternal struct {
	FileID, TilesetID uint32
}

type AseLayer struct {
	Header  AseLayerHeader
	Name    string
	Tileset uint32 // tileset index.
	UUID    AseUUID
}

type AseCel struct {
	Header      AseCelHeader
	Image       AseCelImageHeader
	Tilemap     AseCelTilemapHeader
	Pxs         []byte
	LinkedFrame uint16 // source frame for `AseCelLinked` cels.
}

type AseTags struct {
	Header AseTagsHeader
	Tags   []AseTagSpan
}

type AsePal struct {
	Header  AsePalHeader
	Entries []AsePalEntry
}

type AseOldPal struct {
	Header  AseOldPalHeader
	Packets []AseOldPalPacket
}

type AseUserData struct {
	Header AseUserDataHeader
	Text   string
	RGBA   AseRGBA
	Props  *AseUserDataProps
}

type AseUserDataProps struct {
	Size  uint32
	Count uint32
	Bin   []byte
}

// contains static native tile images; Aseprite defines no per-tile animation.
type AseTileset struct {
	Header   AseTilesetHeader
	Name     string
	External *AseTilesetExternal
	Pxs      []byte // vertically stacked tiles in ascending tile-ID order.
}

type AseRGBA struct{ R, G, B, A uint8 }
type AseRGB struct{ R, G, B uint8 }
type AseUUID [16]byte

type AseDir uint8

const (
	AseDirForward AseDir = iota
	AseDirReverse
	AseDirPingPong
	AseDirPingPongReverse
)

type AseTagSpan struct {
	Header AseTagSpanHeader
	Name   string
}

type AseSlice struct {
	Header AseSliceHeader
	Name   string
	Keys   []AseKey
}

type AseKeyHeader struct {
	Frame  uint32
	Bounds AseXYWH
}

type AseKey struct {
	Header AseKeyHeader
	Center *AseXYWH
	Pivot  *AseXY
}

type AseXY struct {
	X, Y int32 // coords in pixels.
}

type AseXYWH struct {
	X, Y int32  // coords in pixels.
	W, H uint32 // dimensions in pixels.
}
