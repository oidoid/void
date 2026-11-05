package vastar

type node[V any] struct {
	v        V
	cost     float32 // cost from start.
	estimate float32 // estimated cost from start to dst through node.
}

func (this node[V]) Less(other node[V]) bool {
	return this.estimate < other.estimate
}
