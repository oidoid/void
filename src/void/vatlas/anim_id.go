package vatlas

// to-do: rename to Tag.
// identifies an animation in an Atlas.
// 12b.
type AnimID uint16

func (this AnimID) Cel(cel uint8) AnimCel {
	return AnimCel(uint16(this)<<AnimCelShift | uint16(cel&uint8(AnimCelMask)))
}
