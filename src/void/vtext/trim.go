package vtext

type Trim uint8

const (
	TrimNone Trim = iota
	TrimLead      // exclude trailing leading from height.
	TrimAll       // exclude trailing leading and descender space from height.
	// exclude trailing leading from height even when the leading is in use.
	TrimLeadForce
	// exclude trailing leading and descender space from height even when in use.
	TrimAllForce
)

// to-do: can i gen Go from JSON Schema?
