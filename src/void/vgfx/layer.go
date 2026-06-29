package vgfx

// draw order group, 0-15; greater is closer to the viewer.
type Layer uint8

func (this Layer) Z(sub Sublayer) Z { return Z(uint8(this)<<4 | uint8(sub)) }
