"""Ajoute classes.dex à l'APK et aligne les fichiers non compressés sur 4 octets (comme zipalign)."""
import sys, zipfile
src, dex, out = sys.argv[1:4]
zin = zipfile.ZipFile(src)
entries = [(i, zin.read(i.filename)) for i in zin.infolist()]
d = zipfile.ZipInfo('classes.dex', date_time=(2008, 1, 1, 0, 0, 0)); d.compress_type = zipfile.ZIP_DEFLATED
entries.append((d, open(dex, 'rb').read()))
with open(out, 'wb') as f, zipfile.ZipFile(f, 'w') as z:
    for info, data in entries:
        n = zipfile.ZipInfo(info.filename, date_time=info.date_time); n.compress_type = info.compress_type; n.external_attr = info.external_attr
        if n.compress_type == zipfile.ZIP_STORED:
            off = f.tell() + 30 + len(n.filename.encode())
            n.extra = b'\0' * ((4 - off % 4) % 4)
        z.writestr(n, data)
