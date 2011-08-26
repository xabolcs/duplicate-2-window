#!/bin/sh

VER=`grep -Go 'version\>\(.*\)\<' src/install.rdf.in | grep -Go '>\(.*\)<' | sed -e 's/[><]*//g'`
XPI="duplicate2window-$VER.xpi"
echo "Building $XPI ..."

# Copy base structure to a temporary build directory and move in to it
cd src
cat install.rdf.in > install.rdf
rm -rf build
mkdir build
cp -r \
  bootstrap.js images includes locale install.rdf icon.png icon64.png options.xul duplicate2window.xul chrome.manifest \
  build/
cd build

# Cleaning up unwanted files
find . -depth -name '*~' -exec rm -rf "{}" \;
find . -depth -name '#*' -exec rm -rf "{}" \;
find . -depth -name '.DS_Store' -exec rm "{}" \;
find . -depth -name 'Thumbs.db' -exec rm "{}" \;

zip -qr9XD "../../$XPI" *

cd ..
rm -rf build
cd ..
