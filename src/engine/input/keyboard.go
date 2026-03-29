package input

type Key uint16

const (
	KeyUp Key = 1 << iota
	KeyDown
	KeyLeft
	KeyRight
	KeyA
	KeyB
	KeyC
	KeyStart
	KeySelect
)

const MaxTextLen = 4096

type KeyboardPoll struct {
	// buttons pressed bitfield.
	Keys         Key
	TextLen      uint16
	Text         [MaxTextLen]byte
	TextOverflow bool
}
