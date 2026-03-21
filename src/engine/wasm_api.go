package void

type Update struct {
	X, Y float32
}

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)

type WasmAPI interface {
	GetUpdatePointer() uintptr
	Update() LoopState
}
