package vtypes

type Int interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64
}

type Uint interface {
	~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64
}

type Number interface {
	Int | Uint | ~uintptr | ~float32 | ~float64
}
