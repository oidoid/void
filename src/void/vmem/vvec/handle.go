package vvec

// slot reference.
type Handle uint32

func newHandle(slotIndex, gen uint32) Handle {
	return Handle(gen<<genShift | slotIndex&(indexMask<<indexShift))
}
func (this Handle) gen() uint32 {
	return (uint32(this) >> genShift) & genMask
}
func (this Handle) slotIndex() uint32 {
	return (uint32(this) & (indexMask << indexShift)) >> indexShift
}
