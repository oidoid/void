package vtext

type Trim uint8

const (
	TrimNone    Trim = iota
	TrimLeading      // exclude trailing leading from height.
	// exclude trailing leading and descender space from height.
	TrimLeadingAndDescender
)
