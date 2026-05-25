//go:build debug

package vvec

import "fmt"

func (this Handle) String() string {
	return fmt.Sprintf("Handle{slot:%d gen:%d}", this.slotIndex(), this.gen())
}
