include config.make

.PHONY: build build-cmd build-demo build-web clean dependencies fat fmt lint test test-fat test-fmt test-go test-web typecheck-web watch

out_demo := dist/demo.wasm

watch: export DEBUG := 1
watch: dependencies
	watchexec --exts=go --quiet --watch=src/ -- make build-demo&
	npm run watch
	wait

build: build-cmd build-demo build-web
build-cmd:; go build -o dist/ ./src/cmd/...
build-demo:
	# no concurrency.
	tinygo build -o $(out_demo) --scheduler=none --target=wasm ./src/demo/web/
	$(if $(value DEBUG),,wasm-opt -o $(out_demo) -Oz --strip-debug --strip-producers $(out_demo))
build-web: build-demo; npm run build

clean:; rm --force --recursive dist/

dependencies:
	for exe in go node tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done

fat:; go run ./src/cmd/fat dist/demo/demo.wasm dist/demo/index.css dist/demo/index.html dist/demo/index.js

fmt:; go mod tidy& gofmt -s -w ./src/; wait

test: dependencies .WAIT build test-fmt lint test-go test-web typecheck-web .WAIT test-fat
lint:; go vet ./src/...&	go tool staticcheck ./src/...; wait
test-fat:; go run ./src/cmd/fat
test-fmt:
	go mod tidy -diff&
	out=$$(gofmt -l -s ./src/)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
	wait
test-go:
	go test ./src/...|
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$'|
	sed --regexp-extended --unbuffered $(if $(value V),'','/^ok |\[no test files\]$$/d')
test-web:;
	FORCE_COLOR=3 npm run test:unit|
	sed --unbuffered $(if $(value V),'','1,/✖ failing tests:/ {/[✔ℹ▶✖] /d}')
typecheck-web:; npm run typecheck
