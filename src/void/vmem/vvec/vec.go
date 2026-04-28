package vvec

import (
	"fmt"
	"unsafe"

	"github.com/oidoid/void/src/void/vdebug"
)

const (
	indexBits  = 24
	indexMask  = (1 << indexBits) - 1 // xffffff (~16 M).
	indexShift = 0

	genBits  = 8
	genMask  = (1 << genBits) - 1 // xff.
	genShift = 24
)

// contiguous unordered array.
type Vec[V any] struct {
	vals                []V
	slots               []slot
	slotIndexByValIndex []uint32 // len(vals): is free.
}

func New[V any](capacity int) Vec[V] {
	slotIndexByValIndex := make([]uint32, capacity)
	for i := range slotIndexByValIndex {
		slotIndexByValIndex[i] = uint32(i)
	}
	return Vec[V]{
		vals:                make([]V, 0, capacity),
		slots:               make([]slot, capacity),
		slotIndexByValIndex: slotIndexByValIndex,
	}
}

func (this *Vec[V]) Add(v *V) Handle {
	valIndex := len(this.vals)

	if vdebug.Enabled && valIndex == this.Cap() {
		panic(fmt.Sprintf("vec overflow at %d", this.Cap()))
	}

	slotIndex := this.slotIndexByValIndex[valIndex]
	gen := this.slots[slotIndex].gen()
	this.slots[slotIndex] = newSlot(uint32(valIndex), gen)
	this.vals = this.vals[:valIndex+1]
	this.vals[valIndex] = *v

	return newHandle(slotIndex, gen)
}

func (this *Vec[V]) Cap() int { return cap(this.vals) }
func (this *Vec[V]) Clear()   { this.vals = this.vals[:0] }

func (this *Vec[V]) Get(handle Handle) *V {
	if vdebug.Enabled && this.stale(handle) {
		panic(fmt.Sprintf("stale access %s", handle))
	}
	return &this.vals[this.slots[handle.slotIndex()].valIndex()]
}

func (this *Vec[V]) Free(handle Handle) {
	if vdebug.Enabled && this.stale(handle) {
		panic(fmt.Sprintf("stale free %s", handle))
	}

	victim := this.slots[handle.slotIndex()].valIndex()
	last := uint32(len(this.vals) - 1)

	this.vals[victim] = this.vals[last]
	this.slotIndexByValIndex[victim] = this.slotIndexByValIndex[last]
	if victim != last {
		this.slots[this.slotIndexByValIndex[victim]] = this.slots[this.slotIndexByValIndex[victim]].withValIndex(victim)
	}

	this.slotIndexByValIndex[last] = handle.slotIndex()
	this.vals = this.vals[:last]
	this.slots[handle.slotIndex()] = this.slots[handle.slotIndex()].withNextGen()
}

func (this *Vec[V]) Len() int { return len(this.vals) }
func (this *Vec[V]) Pointer() uintptr {
	if this.Cap() == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.vals)))
}
func (this *Vec[V]) Vals() []V { return this.vals }
func (this *Vec[V]) stale(handle Handle) bool {
	return this.slots[handle.slotIndex()].gen() != handle.gen()
}
