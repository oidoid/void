include config.make

out_demo := dist/demo/index.wasm
bundle_version = $(shell git describe --dirty)
bundle_published = $(shell TZ=UTC git log -1 --format=%cd --date=format-local:%Y%m%d)
bundle_id = $(bundle_version)+$(bundle_published)
tinygo_nodebug := --no-debug
go_tags := $(if $(value DEBUG),--tags=debug,)
# pick fastest CPU with `lscpu --extended`.
bench_test := \
	trap 'trap - exit int term; sudo cpupower set --turbo-boost=1' exit int term; \
	sudo cpupower set --turbo-boost=0; \
	GOMAXPROCS=1 powerprofilesctl launch --profile performance -- \
  taskset --cpu-list 3 \
	go test --bench=. --count=15 --cpu=1 --p=1 --parallel=1 --run='^$$' $(go_tags) ./src/demo/...
go_test_filter = \
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$'| \
	sed --regexp-extended --unbuffered $(if $(value V),'','/^ok |\[no test files\]$$|PASS$$|^goos: |^goarch: |^pkg: |^cpu: /d')
# precise GC lets the collector skip scanning pointer-free heap objects instead
# of conservatively treating every word as a possible pointer.
tinygo_flags += $(go_tags) --ldflags="-X github.com/oidoid/void/src/demo/engine.Version=$(bundle_id)" --scheduler=none --gc=precise $(if $(value DEBUG),,$(tinygo_nodebug) --panic=trap) $(if $(value V),--print-allocs=.,)
# $(1) flags
pack_demo = go run ./src/cmd/pack --out=dist/demo/ --tsconfig=src/demo/web/tsconfig.json $(1) src/demo/web/assets/index.html
# $(1) flags
tileset_manifest_demo := dist/demo/tileset-manifest.json
packatlas_demo = go run ./src/cmd/packatlas --name=atlas --img-out=dist/demo/ --atlas-out=src/demo/assets/atlas_bin.go --tags-out=src/demo/tags/tags.go --tileset-manifest-out=$(tileset_manifest_demo) $(1) src/demo/assets/atlas/
packboards_demo = go run ./src/cmd/packboards --tileset-manifest=$(tileset_manifest_demo) --out=src/demo/boards $(1) src/demo/assets/boards/
favicon_demo = \
	mkdir -p dist/demo/favicon; \
	for scale in 1 2 3 4 12 32; do \
		favicon=dist/demo/favicon/favicon$$((scale * 16)); \
		aseprite src/demo/web/assets/favicon.aseprite --batch --color-mode=indexed --scale=$$scale --save-as=$$favicon.png; \
		cwebp -exact -lossless -mt -quiet -z 9 $$favicon.png -o $$favicon.webp; \
	done

.PHONY: bench build build-cmd build-demo build-go build-atlas build-boards build-favicon build-web clean dependencies fat-analyze fat-check fat-save fmt fmt-go fmt-mod fmt-web gen-go install lint lint-critic lint-static lint-vet lint-web slow-check slow-save test test-fmt-go test-fmt-mod test-go test-web typecheck-web watch watch-go watch-atlas watch-boards watch-web

watch: export DEBUG := 1
watch: dependencies build-atlas .WAIT build-boards build-favicon .WAIT watch-go watch-atlas watch-boards watch-web
watch-go:; watchexec --exts=go --quiet --watch=src/ -- $(MAKE) build-go
watch-atlas:; $(call packatlas_demo,--watch)
watch-boards:; $(call packboards_demo,--watch)
watch-web:; $(call pack_demo,--watch)

build: build-cmd build-demo build-web
build-cmd:; go build $(go_tags) -o dist/ ./src/cmd/...
build-demo: build-atlas .WAIT build-boards build-favicon .WAIT build-go
build-go:
	# no concurrency.
	GOOS=wasip1 GOARCH=wasm tinygo build $(tinygo_flags) -o $(out_demo) ./src/demo/web/
	$(if $(value DEBUG),,wasm-opt -o $(out_demo) -Oz --strip-debug --strip-producers $(out_demo))
build-atlas:; $(call packatlas_demo,)
build-boards: build-atlas; $(call packboards_demo,)
build-favicon:; $(favicon_demo)
build-web: build-demo build-atlas
	$(call pack_demo,--minify --one-file)
	$(if $(value DEBUG),,cp dist/demo/index.html 'dist/demo/void-$(bundle_id).html')

clean:; rm --force --recursive dist/ src/demo/assets/atlas_bin.go src/demo/tags/tags.go

dependencies:
	for exe in go mono node shader_minifier.exe tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done

fat-analyze: tinygo_nodebug :=
fat-analyze: tinygo_flags += --size full
fat-analyze: build
fat-check:; go run ./src/cmd/fat check
fat-save:; go run ./src/cmd/fat save

fmt: fmt-mod fmt-go fmt-web
fmt-mod:; go mod tidy
fmt-go:; go fmt ./src/...
fmt-web:; npx lint --fix > /dev/null

gen-go:; go generate ./src/...

install:; go mod download; npm install;

lint: lint-critic lint-static lint-vet lint-web
lint-critic:; go tool go-critic check --enableAll --disable=unnamedResult ./src/...
lint-static:; go tool staticcheck ./src/...
lint-vet:; go vet ./src/...
lint-web:; npx lint > /dev/null

test: dependencies .WAIT build .WAIT test-fmt-go test-fmt-mod lint test-go test-web typecheck-web .WAIT fat-check
test-fmt-go:
	out=$$(go fmt ./src/...)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
test-fmt-mod:; go mod tidy -diff
test-go:;	go test $(go_tags) ./src/... | $(go_test_filter)
test-web:;
	FORCE_COLOR=3 npm run test:unit|
	sed --unbuffered $(if $(value V),'','1,/✖ failing tests:/ {/[✔ℹ▶✖] /d}')
typecheck-web:; npm run typecheck

bench:; $(bench_test) | $(go_test_filter)
slow-check:; $(bench_test) | go run ./src/cmd/slow check
slow-save:; $(bench_test) | go run ./src/cmd/slow save
