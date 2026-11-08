package vheap

// min-heap of values ordered by their less method:
//   - no child is less than its parent.
//   - the tree is balanced and complete but not necessarily perfect. slice
//     indices run left to right across each level, then continue below. all
//     levels are full except possibly the last, which packs from the left.
//   - the head is the first node (index 0) and has no parent.
//   - the parent of any other node is `(i - 1) / 2` truncated.
//   - the children of any node, when present, are adjacent at `2*i + 1` (left)
//     and `2*i + 2` (right), when within slice bounds.
//   - less defines a strict weak ordering. equivalent values have no guaranteed
//     removal order.
//
// example values ordered numerically, with their slice indices:
//
//	               ___________21___________
//	              /                        \
//	        _____45_____               ____43____
//	       /            \             /          \
//	    __46__        __51__       __56__      __50__
//	   /      \      /      \     /      \    /      \
//	  60      70    62      52   57      58  53      54
//	 /  \    /
//	61  63  88
//	[21, 45, 43, 46, 51, 56, 50, 60, 70, 62, 52, 57, 58, 53, 54, 61, 63, 88]
//	 0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17
//
// example parents:
//   - value 88 at index 17: (17 - 1) / 2 = 8 (value 70).
//   - value 70 at index 8: (8 - 1) / 2 = 3 (value 46).
//   - value 46 at index 3: (3 - 1) / 2 = 1 (value 45).
//   - value 45 at index 1: (1 - 1) / 2 = 0 (value 21).
//   - value 21 at index 0 is the root.
type Heap[V Lesser[V]] []V

// defines the ordering supplied by heap values.
type Lesser[V any] interface {
	Less(V) bool
}

func (this *Heap[V]) Push(node V) {
	nodes := append(*this, node)
	for i := len(nodes) - 1; i > 0; {
		parent := (i - 1) / 2
		if !nodes[i].Less(nodes[parent]) {
			break
		}
		nodes[i], nodes[parent] = nodes[parent], nodes[i]
		i = parent
	}
	*this = nodes
}

func (this *Heap[V]) Pop() V {
	nodes := *this
	minVal, last := nodes[0], len(nodes)-1
	nodes[0] = nodes[last]
	clear(nodes[last:]) // release pointer-bearing values.
	nodes = nodes[:last]
	for i := 0; i*2+1 < len(nodes); {
		child := i*2 + 1
		if right := child + 1; right < len(nodes) &&
			nodes[right].Less(nodes[child]) {
			child = right
		}
		if !nodes[child].Less(nodes[i]) {
			break
		}
		nodes[i], nodes[child] = nodes[child], nodes[i]
		i = child
	}
	*this = nodes
	return minVal
}
