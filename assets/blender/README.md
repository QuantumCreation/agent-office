# Blender assets

Each `*.py` here builds one or more models with Blender's Python API and exports them to `public/models/<name>.glb`, plus a preview render in `assets/previews/<name>.png`.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python assets/blender/office_chair.py
./assets/blender/build_all.sh      # rebuild everything
```

Conventions are documented at the top of `lib.py`:
- Meters.
- The origin is at the floor center of the footprint (or the attachment point for wall- and ceiling-mounted items).
- The front faces Blender -Y.
- Named materials drive the in-game look: `accent*`, `fabric*`, `screen*`, `glass*`, `emissive*`, and plain colors.
