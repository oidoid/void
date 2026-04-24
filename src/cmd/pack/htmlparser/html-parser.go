package htmlparser

import (
	"os"

	"golang.org/x/net/html"
)

func NodeAttr(node *html.Node, k string) string {
	for _, attr := range node.Attr {
		if attr.Key == k {
			return attr.Val
		}
	}
	return ""
}

func ParseDoc(filename string) (*html.Node, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return html.Parse(file)
}

func QueryTag(root *html.Node, tag string) []*html.Node {
	var nodes []*html.Node
	stack := []*html.Node{root}
	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if node.Type == html.ElementNode && node.Data == tag {
			nodes = append(nodes, node)
		}
		for child := node.FirstChild; child != nil; child = child.NextSibling {
			stack = append(stack, child)
		}
	}
	return nodes
}

func RemoveNodeAttr(node *html.Node, k string) {
	attrs := node.Attr[:0]
	for _, attr := range node.Attr {
		if attr.Key != k {
			attrs = append(attrs, attr)
		}
	}
	node.Attr = attrs
}

// replaces old with node in the tree.
func ReplaceNode(old, newNode *html.Node) {
	newNode.Parent = old.Parent
	newNode.PrevSibling = old.PrevSibling
	newNode.NextSibling = old.NextSibling
	if old.PrevSibling != nil {
		old.PrevSibling.NextSibling = newNode
	} else if old.Parent != nil {
		old.Parent.FirstChild = newNode
	}
	if old.NextSibling != nil {
		old.NextSibling.PrevSibling = newNode
	} else if old.Parent != nil {
		old.Parent.LastChild = newNode
	}
	old.Parent, old.PrevSibling, old.NextSibling = nil, nil, nil
}

func SetNodeAttr(node *html.Node, k, v string) {
	for i, attr := range node.Attr {
		if attr.Key == k {
			node.Attr[i].Val = v
			return
		}
	}
	node.Attr = append(node.Attr, html.Attribute{Key: k, Val: v})
}

func SetTextContent(node *html.Node, text string) {
	for node.FirstChild != nil {
		node.RemoveChild(node.FirstChild)
	}
	child := &html.Node{Type: html.TextNode, Data: text, Parent: node}
	node.FirstChild = child
	node.LastChild = child
}
