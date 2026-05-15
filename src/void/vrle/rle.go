package vrle

import "github.com/oidoid/void/src/void/vtypes"

type Pair[V any, Count vtypes.Uint] struct {
	Val   V
	Count Count
}

func Encode[V comparable, Count vtypes.Uint](vals []V) []Pair[V, Count] {
	var pairs []Pair[V, Count]
	if len(vals) == 0 {
		return pairs
	}
	cur := vals[0]
	count := Count(1)
	for _, v := range vals[1:] {
		if v == cur && count < ^Count(0) {
			count++
		} else {
			pairs = append(pairs, Pair[V, Count]{cur, count})
			cur = v
			count = 1
		}
	}
	return append(pairs, Pair[V, Count]{cur, count})
}
