//go:build debug

package vvec

func (this *Vec[V]) Get(handle Handle) *V {
	if this.stale(handle) {
		panic("stale access " + handle.String())
	}
	return this.get(handle)
}

func (this *Vec[V]) Free(handle Handle) {
	if this.stale(handle) {
		panic("stale free " + handle.String())
	}
	this.free(handle)
}

// drops every val and invalidates its handle so stale access panics.
func (this *Vec[V]) Clear() {
	for valIndex := range this.vals {
		slotIndex := this.slotIndexByValIndex[valIndex]
		this.slots[slotIndex] = this.slots[slotIndex].withNextGen()
	}
	this.vals = this.vals[:0]
}

func (this *Vec[V]) stale(handle Handle) bool {
	return this.slots[handle.slotIndex()].gen() != handle.gen()
}
