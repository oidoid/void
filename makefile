include config.make

.PHONY: default build build-cmd build-demo clean dependencies fat fmt lint test test-fat test-go test-fmt

test: dependencies .WAIT build test-fmt lint test-go .WAIT test-fat
build: build-cmd build-demo
build-cmd:; go build -o dist/ ./src/cmd/...
build-demo:
	# no concurrency.
	tinygo build -o dist/demo.wasm --scheduler=none --target=wasm ./src/demo/
	$(if $(value DEBUG),,wasm-opt -o dist/demo.wasm -Oz --strip-debug --strip-producers dist/demo.wasm)
clean:; rm --force --recursive dist/
dependencies:
	for exe in go node tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done
fat:; go run ./src/cmd/fat dist/demo.wasm
fmt:; go mod tidy& gofmt -s -w ./src/; wait
lint:; go vet ./src/...&	go tool staticcheck ./src/...; wait
test-fat:; go run ./src/cmd/fat
test-go:
	go test ./src/... |
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$' |
	sed --unbuffered $(if $(value V),'','/^ok /d; /\[no test files\]$$/d')
test-fmt:
	go mod tidy -diff&
	out=$$(gofmt -l -s ./src/)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
	wait
