package void

type LoopState uint8

const (
	Pause LoopState = iota
	Loop
)

type WasmAPI interface {
	SpriteCount() uint32
	SpritePointer() uintptr
	FramePointer() uintptr
	Update() LoopState
}
