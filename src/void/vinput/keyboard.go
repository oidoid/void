package vinput

type Key uint16

const (
	KeyUp Key = 1 << iota
	KeyDown
	KeyLeft
	KeyRight
	KeyA
	KeyB
	KeyC
	KeyMenu
	KeyBack

	keyBits = iota
)

type Keyboard struct {
	Keys         Key
	Text         string
	TextOverflow bool
}

const MaxTextLen = 4096

type KeyboardPoll struct {
	// buttons pressed bitfield.
	Keys    Key
	TextLen uint16
	// UTF-8 encoded text input this frame.
	Text [MaxTextLen]byte
	// true if text input exceeded MaxTextLen and was truncated.
	TextOverflow bool
}
