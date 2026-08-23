package vatlas

// to-do: rename to Tag.
// identifies an animation in an Atlas; AnimCel stores it in 12 bits.
type AnimID uint16

const MaxAnimIDs = 1 << 12

func (this AnimID) Cel(cel uint8) AnimCel {
	return AnimCel(uint16(this)<<AnimCelShift | uint16(cel&uint8(AnimCelMask)))
}
