package vvec

// val reference.
type slot uint32

func newSlot(valIndex, gen uint32) slot {
	return slot(gen<<indexBits | valIndex&(indexMask<<indexShift))
}
func (this slot) gen() uint32 {
	return (uint32(this) >> genShift) & genMask
}
func (this slot) valIndex() uint32 {
	return (uint32(this) & (indexMask << indexShift)) >> indexShift
}
func (this slot) withNextGen() slot {
	next := (this.gen() + 1) & genMask
	return newSlot(this.valIndex(), next)
}
func (this slot) withValIndex(i uint32) slot { return newSlot(i, this.gen()) }
