//go:build !debug

package vvec

// do not hold pointer.
func (this *Vec[V]) Get(handle Handle) *V { return this.get(handle) }
func (this *Vec[V]) Free(handle Handle)   { this.free(handle) }

// drops every val in constant time. handles issued before are not
// invalidated; debug builds do so stale access panics.
func (this *Vec[V]) Clear() { this.vals = this.vals[:0] }
