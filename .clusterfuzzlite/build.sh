#!/bin/bash -eu
cp "$SRC/dreambound-adventures/serve_dreambound.py" "$SRC/dreambound-adventures/fuzz/serve_dreambound.py"
compile_python_fuzzer "$SRC/dreambound-adventures/fuzz/dreambound_path_fuzzer.py"
