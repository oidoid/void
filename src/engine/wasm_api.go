package void

type Update struct {
	X, Y float32
}

type WasmAPI interface {
	GetUpdatePointer() uintptr
	Update()
}
