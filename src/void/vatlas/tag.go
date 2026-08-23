package vatlas

// identifies an animation in an Atlas; TagCel stores it in 12 bits.
type Tag uint16

const MaxTags = 1 << 12

func (this Tag) Cel(cel uint8) TagCel {
	return TagCel(uint16(this)<<TagCelShift | uint16(cel&uint8(TagCelMask)))
}
