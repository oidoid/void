package main

import void "github.com/oidoid/void/src/engine"

func main() {}

//export Hello
func Hello() {
	void.Hello()
	println("hello from Go demo")
}
