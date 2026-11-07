#!/usr/bin/env bash
# Fabrique l'APK de MW+ sans Android Studio.
# Usage : MWPLUS_KEYSTORE=/chemin/mwplus.jks MWPLUS_KEYPASS=motdepasse ./build.sh 1.0 1
# Outils téléchargés depuis Maven Central : aapt2 (dans apktool-lib), dx, apksig.
set -euo pipefail
VERSION=${1:-1.0}; CODE=${2:-1}
ICI=$(cd "$(dirname "$0")" && pwd); T="$ICI/.outils"; B="$ICI/.build"
mkdir -p "$T" "$B"; rm -rf "$B"/*
M=https://repo1.maven.org/maven2
[ -f "$T/apktool.jar" ] || curl -sfL -o "$T/apktool.jar" $M/org/apktool/apktool-lib/3.0.3/apktool-lib-3.0.3.jar
[ -f "$T/dx.jar" ] || curl -sfL -o "$T/dx.jar" $M/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar
[ -f "$T/apksig.jar" ] || curl -sfL -o "$T/apksig.jar" $M/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar
[ -x "$T/prebuilt/linux/aapt2" ] || (cd "$T" && unzip -oq apktool.jar prebuilt/linux/aapt2 prebuilt/android-framework.jar && chmod +x prebuilt/linux/aapt2)
AAPT2="$T/prebuilt/linux/aapt2"; FW="$T/prebuilt/android-framework.jar"

"$AAPT2" compile --dir "$ICI/res" -o "$B/res.zip"
"$AAPT2" link -o "$B/base.apk" -I "$FW" --manifest "$ICI/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 34 --version-code "$CODE" --version-name "$VERSION" "$B/res.zip"

mkdir -p "$B/stubs" "$B/classes"
javac -nowarn --release 8 -d "$B/stubs" $(find "$ICI/stubs" -name '*.java')
javac -nowarn --release 8 -cp "$B/stubs" -d "$B/classes" $(find "$ICI/src" -name '*.java')
java -cp "$T/dx.jar" com.android.dx.command.Main --dex --min-sdk-version=24 --output="$B/classes.dex" "$B/classes"

python3 "$ICI/outils/aligner.py" "$B/base.apk" "$B/classes.dex" "$B/aligne.apk"
javac -nowarn -cp "$T/apksig.jar" -d "$B" "$ICI/outils/Signer.java"
java --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-exports java.base/sun.security.pkcs=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED -cp "$T/apksig.jar:$B" Signer "$MWPLUS_KEYSTORE" "$MWPLUS_KEYPASS" mwplus "$B/aligne.apk" "$ICI/MWplus-$VERSION.apk"
echo "APK prête : $ICI/MWplus-$VERSION.apk"
