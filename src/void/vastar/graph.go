package vastar

import (
	"slices"

	"github.com/oidoid/void/src/void/vheap"
)

// searches a finite graph of comparable nodes.
type Graph[V comparable] struct {
	// appends walkable neighbors to dst and returns the resulting slice.
	Adjacent func(val V, dst []V) []V
	// returns a finite, nonnegative edge cost.
	Cost func(from, to V) float32
	// returns a finite, nonnegative lower bound on remaining cost. nil uses
	// Dijkstra.
	Heuristic func(from, to V) float32

	open     vheap.Heap[node[V]]
	visits   map[V]visit[V]
	adjacent []V
	path     []V
}

type visit[V comparable] struct {
	parent V
	cost   float32
}

func NewGraph[V comparable](
	adjacent func(val V, dst []V) []V, cost func(from, to V) float32,
) Graph[V] {
	return Graph[V]{Adjacent: adjacent, Cost: cost, visits: make(map[V]visit[V])}
}

// finds a least-cost path, including both endpoints. paths share storage with
// the graph and remain valid until the next `Plot()` or `PathTo()` call.
// unreachable destinations return nil.
func (this *Graph[V]) Plot(from, to V) []V {
	clear(this.open)
	this.open = this.open[:0]
	clear(this.path)
	this.path = this.path[:0]
	clear(this.visits)
	this.visits[from] = visit[V]{parent: from}
	this.open.Push(node[V]{v: from})
	for len(this.open) != 0 {
		current := this.open.Pop()
		if current.cost != this.visits[current.v].cost {
			continue // a cheaper route superseded this heap entry.
		}
		if current.v == to {
			return this.PathTo(to)
		}
		clear(this.adjacent)
		this.adjacent = this.Adjacent(current.v, this.adjacent[:0])
		for _, next := range this.adjacent {
			cost := current.cost + this.Cost(current.v, next)
			if prior, ok := this.visits[next]; ok && prior.cost <= cost {
				continue
			}
			this.visits[next] = visit[V]{cost: cost, parent: current.v}
			estimate := cost
			if this.Heuristic != nil {
				estimate += this.Heuristic(next, to)
			}
			this.open.Push(node[V]{v: next, cost: cost, estimate: estimate})
		}
	}
	return nil
}

// returns the last search's route to a visited node. after an unsuccessful
// `Plot()`, callers can use this to reach a nearby accessible destination.
// routes to nodes still in the open set may not yet have their least cost.
// unvisited nodes return nil. paths share storage with `Plot()` and `PathTo()`.
func (this *Graph[V]) PathTo(to V) []V {
	clear(this.path)
	this.path = this.path[:0]
	if _, ok := this.visits[to]; !ok {
		return nil
	}
	for v := to; ; {
		this.path = append(this.path, v)
		parent := this.visits[v].parent
		if parent == v {
			break
		}
		v = parent
	}
	slices.Reverse(this.path)
	return this.path
}
