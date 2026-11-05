package vheap

import "testing"

type testHeapVal [1]int

func (this testHeapVal) Less(other testHeapVal) bool {
	return this[0] > other[0]
}

func TestHeapValOrder(t *testing.T) {
	this := Heap[testHeapVal]{}
	for _, v := range []int{3, 1, 4, 1, 5, 9, 2} {
		this.Push(testHeapVal{v})
	}
	if got := this.Pop()[0]; got != 9 {
		t.Fatalf("pop = %d, want 9", got)
	}
	this.Push(testHeapVal{10})
	for _, want := range []int{10, 5, 4, 3, 2, 1, 1} {
		if got := this.Pop()[0]; got != want {
			t.Fatalf("pop = %d, want %d", got, want)
		}
	}
	if len(this) != 0 {
		t.Fatalf("heap still contains %d values", len(this))
	}
}
