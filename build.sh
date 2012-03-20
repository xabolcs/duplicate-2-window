#!/bin/sh

VER=`grep -Go 'version\>\(.*\)\<' src/install.rdf.in | grep -Go '>\(.*\)<' | sed -e 's/[><]*//g'`
XPI="duplicate2window-$VER.xpi"
echo "Building $XPI ..."

# Copy base structure to a temporary build directory and move in to it
cd src
cat install.rdf.in > install.rdf
rm -rf build
mkdir build

# Copying only the needed files
find . -name '*.js' \
  -o -name '*.png' \
  -o -name '*.properties' \
  -o -name '*.xul' \
  -o -name 'install.rdf' \
  -o -name '*.manifest' \
  | xargs cp -t build --parents
cd build 

zip -qr9XD "../../$XPI" *

cd ..
rm -rf build
cd ..
