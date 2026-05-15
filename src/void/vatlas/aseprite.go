package vatlas

// https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md
type AseFile struct {
	Meta AseMeta `json:"meta"`
	// where key is from `--tagname-format={filestem}--{animation}`.
	Frames map[string]AseFrame `json:"frames"`
}

type AseMeta struct {
	// e.g., `http://www.aseprite.org/`.
	App string `json:"app"`
	// e.g., `1.3.15.4-x64`.
	Version string `json:"version"`
	// output basename. e.g., `atlas.png`.
	Image string `json:"image"`
	// e.g., `RGBA8888` or `I8`.
	Format string `json:"format"`
	// output dimensions (`--sheet-pack`).
	Size AseWH `json:"size"`
	// e.g., `1`.
	Scale string `json:"scale"`
	// all TagSpans for all files packed (`--list-tags`).
	FrameTags []AseTagSpan `json:"frameTags"`
	// all slices for all files packed (`--list-slices`).
	Slices []AseSlice `json:"slices"`
}

// a cel.
type AseFrame struct {
	// animation length in milliseconds.
	Duration uint16 `json:"duration"`
	// bounds including padding (`--inner-padding=n`).
	Frame   AseXYWH `json:"frame"`
	Rotated bool    `json:"rotated"`
	Trimmed bool    `json:"trimmed"`
	// bounds not including padding. x and y are always zero.
	SpriteSourceSize AseXYWH `json:"spriteSourceSize"`
	// WH without padding.
	SourceSize AseWH `json:"sourceSize"`
}

// animate from start to end; when looping, return to start.
const AseDirForward AseDir = "forward"

// animate from end to start; when looping, return to end.
const AseDirReverse AseDir = "reverse"

// animate from start to end - 1 or start, whichever is greater; when looping,
// change direction (initially, end to start + 1 or end, whichever is lesser).
// a traversal from start to end - 1 then end to start + 1 is one complete loop.
const AseDirPingPong AseDir = "pingpong"

// like PingPong but start from end - 1 or start, whichever is greater.
const AseDirPingPongReverse AseDir = "pingpong_reverse"

// animation playback direction for an AseTagSpan.
type AseDir string

// a label and animation behavior. references Frames to form an animation.
type AseTagSpan struct {
	// tag.
	Name string `json:"name"`
	// inclusive starting AseFrame index.
	From uint16 `json:"from"`
	// inclusive ending index, possibly equal to from.
	To        uint16 `json:"to"`
	Direction AseDir `json:"direction"`
	// number of times to replay the animation. undefined is infinite.
	Repeat string `json:"repeat"`
	// arbitrary data assumed to be empty or a stringified JSON object.
	Data string
}

type AseSlice struct {
	// `#ff0000ff` is hitbox, `#00ff00ff` is hurtbox, `#0000ffff` (default
	// Aseprite slice color) is both.
	Color string `json:"color"`
	// tag.
	Name string   `json:"name"`
	Keys []AseKey `json:"keys"`
}

type AseKey struct {
	// slice dimensions.
	Bounds AseXYWH `json:"bounds"`
	// inclusive AseFrame start offset.
	Frame uint32 `json:"frame"`
}

type AseXYWH struct {
	X int32  `json:"x"`
	Y int32  `json:"y"`
	W uint32 `json:"w"`
	H uint32 `json:"h"`
}

type AseWH struct {
	W uint16 `json:"w"`
	H uint16 `json:"h"`
}
