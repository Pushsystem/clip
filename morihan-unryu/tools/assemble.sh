#!/bin/sh
# index.html = head + engine (adapted from the ipad-sketch demo) + this film's page + camera/stylus/composite + render
H=$(cd "$(dirname "$0")/.." && pwd)
cat "$H/src/head.html" "$H/src/engine1.js" "$H/src/page.js" "$H/src/engine2.js" "$H/src/tail.js" > "$H/index.html"
