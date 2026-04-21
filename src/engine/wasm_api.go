package void

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)

type WasmAPI interface {
	FramePointer() uintptr
	Update() LoopState
}
