package vgfx

// combined draw order: upper nibble = Layer, lower nibble = Sublayer.
type Z uint8

func (this Z) Layer() Layer { return Layer(this >> 4) }
