//go:build !debug

package vvec

// do not hold pointer.
func (this *Vec[V]) Get(handle Handle) *V { return this.get(handle) }
func (this *Vec[V]) Free(handle Handle)   { this.free(handle) }
