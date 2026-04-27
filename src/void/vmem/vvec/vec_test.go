package vvec

import (
	"testing"
	"unsafe"
)

func TestPointerZeroCapacityIsZero(t *testing.T) {
	vec := New[int](0)

	if got := vec.Pointer(); got != 0 {
		t.Errorf("got pointer %d, want 0", got)
	}
}

func TestPointerEmptySliceUsesBackingArray(t *testing.T) {
	vec := New[int](4)
	pointerBeforeAdd := vec.Pointer()

	if pointerBeforeAdd == 0 {
		t.Fatal("got 0 pointer for nonzero capacity")
	}

	v := 7
	vec.Add(&v)

	pointerAfterAdd := uintptr(unsafe.Pointer(&vec.Vals()[0]))
	if pointerBeforeAdd != pointerAfterAdd {
		t.Errorf("got pointer %d before add and %d after add, want same backing array", pointerBeforeAdd, pointerAfterAdd)
	}
}

func TestFreeCompactsAndPreservesLiveHandles(t *testing.T) {
	vec := New[int](3)

	a, b, c := 10, 20, 30
	handleA := vec.Add(&a)
	handleB := vec.Add(&b)
	handleC := vec.Add(&c)

	vec.Free(handleB)

	if got := vec.Len(); got != 2 {
		t.Fatalf("got len %d, want 2", got)
	}

	vals := vec.Vals()
	if vals[0] != 10 || vals[1] != 30 {
		t.Fatalf("got vals %v, want [10 30]", vals)
	}

	if got := *vec.Get(handleA); got != 10 {
		t.Errorf("got value %d for handleA, want 10", got)
	}

	if got := *vec.Get(handleC); got != 30 {
		t.Errorf("got value %d for handleC, want 30", got)
	}
}

func TestAddReusesFreedSlotWithNextGen(t *testing.T) {
	vec := New[int](3)

	a, b, c := 10, 20, 30
	_ = vec.Add(&a)
	freedHandle := vec.Add(&b)
	_ = vec.Add(&c)

	vec.Free(freedHandle)

	d := 40
	newHandle := vec.Add(&d)

	if newHandle.slotIndex() != freedHandle.slotIndex() {
		t.Fatalf("got slot %d, want reused slot %d", newHandle.slotIndex(), freedHandle.slotIndex())
	}

	if newHandle.gen() == freedHandle.gen() {
		t.Fatalf("got gen %d, want a new gen after reuse", newHandle.gen())
	}

	if got := *vec.Get(newHandle); got != 40 {
		t.Errorf("got val %d for reused handle, want 40", got)
	}
}
