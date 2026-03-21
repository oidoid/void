.POSIX: # fail recipes on the first failing command.

# parallelize by default which also allows multiple watch tasks to execute in
# parallel without `xargs -P`; only use the rules and variables supplied; don't
# echo recipes unless debugging with `V=1 make --jobs=1`; report uninitialized
# variable usage.
GNUMAKEFLAGS += --jobs --no-builtin-rules --no-builtin-variables $(if $(value V),,--quiet) --warn-undefined-variables

# execute each recipe in one shell and fail on first error, undefined variable
# usage, or any nonzero status in the pipeline. assume bash-ish.
.ONESHELL:
.SHELLFLAGS := -euo pipefail -c

.DELETE_ON_ERROR: # if a recipe fails, delete the target.
