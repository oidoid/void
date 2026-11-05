package vastar

import (
	"slices"
	"testing"
)

type testEdge struct {
	node int
	cost float32
}

func TestPlot(t *testing.T) {
	for _, test := range []struct {
		name      string
		edges     map[int][]testEdge
		heuristic map[int]float32
		from, to  int
		path      []int
	}{
		{
			name: "same node", from: 7, to: 7,
			path: []int{7},
		},
		{
			name: "unreachable", to: 2,
			edges: map[int][]testEdge{0: {{1, 2}}},
		},
		{
			name: "direct", to: 1,
			edges: map[int][]testEdge{0: {{1, 2.5}}},
			path:  []int{0, 1},
		},
		{
			name: "cheaper route", to: 3,
			edges: map[int][]testEdge{
				0: {{1, 8}, {2, 1}}, 2: {{1, 1}, {3, 9}}, 1: {{3, 1}},
			},
			heuristic: map[int]float32{0: 3, 1: 1, 2: 2},
			path:      []int{0, 2, 1, 3},
		},
		{
			name: "settles goal before returning", to: 3,
			edges:     map[int][]testEdge{0: {{3, 10}, {1, 1}}, 1: {{3, 1}}},
			heuristic: map[int]float32{0: 2, 1: 1},
			path:      []int{0, 1, 3},
		},
		{
			name: "zero cost cycles", to: 2,
			edges: map[int][]testEdge{0: {{0, 0}, {1, 0}}, 1: {{0, 0}, {2, 1}}},
			path:  []int{0, 1, 2},
		},
		{
			name: "fractional costs", to: 1,
			edges: map[int][]testEdge{0: {{1, .75}, {2, .25}}, 2: {{1, .25}}},
			path:  []int{0, 2, 1},
		},
		{
			name: "reopens with inconsistent admissible heuristic", to: 3,
			edges: map[int][]testEdge{
				0: {{1, 3}, {2, 1}}, 2: {{1, 1}}, 1: {{3, 3}},
			},
			heuristic: map[int]float32{2: 4},
			path:      []int{0, 2, 1, 3},
		},
		{
			name: "nonzero start with cycle", from: 2, to: 4,
			edges: map[int][]testEdge{2: {{3, 1}}, 3: {{2, 0}, {4, 1}}},
			path:  []int{2, 3, 4},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			graph := testGraph(test.edges, test.heuristic)
			path := graph.Plot(test.from, test.to)
			if !slices.Equal(path, test.path) {
				t.Fatalf("Plot = %v, want %v", path, test.path)
			}
		})
	}
}

func TestPlotUsesHeuristic(t *testing.T) {
	graph := testGraph(map[int][]testEdge{
		0: {{2, 1}, {1, 1}}, 1: {{3, 1}},
	}, map[int]float32{0: 2, 1: 1, 2: 100})
	adjacent := graph.Adjacent
	graph.Adjacent = func(node int, dst []int) []int {
		if node == 2 {
			t.Fatal("expanded costly branch before reaching the goal")
		}
		return adjacent(node, dst)
	}
	path := graph.Plot(0, 3)
	if !slices.Equal(path, []int{0, 1, 3}) {
		t.Fatalf("heuristic route = %v", path)
	}
}

func TestPlotSkipsSupersededSteps(t *testing.T) {
	graph := testGraph(map[int][]testEdge{
		0: {{1, 8}, {2, 1}}, 2: {{1, 1}},
	}, nil)
	adjacent := graph.Adjacent
	expanded := make(map[int]int)
	graph.Adjacent = func(node int, dst []int) []int {
		expanded[node]++
		return adjacent(node, dst)
	}
	graph.Plot(0, 3)
	if expanded[1] != 1 {
		t.Fatalf("expanded improved node %d times, want once", expanded[1])
	}
}

func TestPlotReuseAndPathTo(t *testing.T) {
	graph := testGraph(map[int][]testEdge{0: {{1, 1}}, 1: {{2, 1}}}, nil)
	graph.Plot(0, 3)
	path := graph.PathTo(2)
	if !slices.Equal(path, []int{0, 1, 2}) {
		t.Fatalf("reachable fallback = %v", path)
	}
	graph.Plot(2, 0)
	path = graph.PathTo(1)
	if path != nil {
		t.Fatalf("previous search leaked into next search: %v", path)
	}
	path = graph.Plot(1, 2)
	if !slices.Equal(path, []int{1, 2}) {
		t.Fatalf("reused search = %v", path)
	}
}

func TestPlotPointerNodes(t *testing.T) {
	goal := 1
	graph := NewGraph[*int](
		func(node *int, dst []*int) []*int {
			if node == nil {
				return append(dst, &goal)
			}
			return dst
		},
		func(_, _ *int) float32 { return 1 },
	)
	path := graph.Plot(nil, &goal)
	if !slices.Equal(path, []*int{nil, &goal}) {
		t.Fatalf("pointer route = %v", path)
	}
}

func testGraph(
	edges map[int][]testEdge, heuristic map[int]float32,
) Graph[int] {
	this := NewGraph(
		func(node int, dst []int) []int {
			for _, edge := range edges[node] {
				dst = append(dst, edge.node)
			}
			return dst
		},
		func(from, to int) float32 {
			for _, edge := range edges[from] {
				if edge.node == to {
					return edge.cost
				}
			}
			panic("missing edge")
		},
	)
	if heuristic != nil {
		this.Heuristic = func(from, _ int) float32 { return heuristic[from] }
	}
	return this
}
