//go:build debug

package vvec

import "testing"

func TestClearInvalidatesHandles(t *testing.T) {
	vec := New[int](2)
	old := vec.Add(1)
	_ = vec.Add(2)

	vec.Clear()

	if got := vec.Len(); got != 0 {
		t.Fatalf("got len %d, want 0", got)
	}
	fresh := vec.Add(3)
	if fresh == old {
		t.Fatalf("got handle %v reissued after Clear()", fresh)
	}
	if got := *vec.Get(fresh); got != 3 {
		t.Errorf("got val %d for fresh handle, want 3", got)
	}

	defer func() {
		if recover() == nil {
			t.Error("Get() of a handle from before Clear() did not panic")
		}
	}()
	vec.Get(old)
}
