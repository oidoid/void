package vvec

import (
	"unsafe"
)

const (
	indexBits  = 24
	indexMask  = (1 << indexBits) - 1 // xffffff (~16 M).
	indexShift = 0

	genBits  = 8
	genMask  = (1 << genBits) - 1 // xff.
	genShift = 24
)

// fixed contiguous unordered array.
type Vec[V any] struct {
	vals                []V
	slots               []slot
	slotIndexByValIndex []uint32 // >= len(vals): is free.
}

func New[V any](size ...int) Vec[V] {
	initSize := 0
	if len(size) > 0 {
		initSize = size[0]
	}
	slotIndexByValIndex := make([]uint32, initSize)
	for i := range slotIndexByValIndex {
		slotIndexByValIndex[i] = uint32(i)
	}
	return Vec[V]{
		vals:                make([]V, 0, initSize),
		slots:               make([]slot, initSize),
		slotIndexByValIndex: slotIndexByValIndex,
	}
}

func (this *Vec[V]) Add(v V) Handle {
	valIndex := len(this.vals)

	var slotIndex uint32
	if valIndex == len(this.slots) {
		slotIndex = uint32(valIndex)
		this.slots = append(this.slots, 0)
		this.slotIndexByValIndex = append(this.slotIndexByValIndex, slotIndex)
	} else {
		slotIndex = this.slotIndexByValIndex[valIndex]
	}

	gen := this.slots[slotIndex].gen()
	this.slots[slotIndex] = newSlot(uint32(valIndex), gen)
	this.vals = append(this.vals, v)

	return newHandle(slotIndex, gen)
}

func (this *Vec[V]) Cap() int { return cap(this.vals) }
func (this *Vec[V]) Clear()   { this.vals = this.vals[:0] }

func (this *Vec[V]) get(handle Handle) *V {
	return &this.vals[this.slots[handle.slotIndex()].valIndex()]
}

func (this *Vec[V]) free(handle Handle) {
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
