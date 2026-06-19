package vtext

type Trim uint8

const (
	TrimNone    Trim = iota
	TrimLeading      // exclude trailing leading from height.
	// exclude trailing leading and descender space from height.
	TrimLeadingAndDescender
)

// to-do: add unconditional forms that trim leading and both leading and
//        descender even if used.
// to-do: can i gen Go from JSON Schema?
