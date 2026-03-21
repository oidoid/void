package void

import "unsafe"

type Void struct {
	update Update
}

var _ WasmAPI = (*Void)(nil)

func (v *Void) GetUpdatePointer() uintptr {
	return uintptr(unsafe.Pointer(&v.update))
}

func (v *Void) Update() {
	println("hello from Go engine %d %d", v.update.X, v.update.Y)
}
