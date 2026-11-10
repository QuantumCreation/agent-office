# Contributing

Thanks for wanting to help with Agent Office! Pull requests are welcome.

## Getting started

1. Fork the repo and create a branch from `main`.
2. Install dependencies and run the office locally (the T3 Code app needs to be open):

   ```sh
   npm install
   npm run dev        # http://127.0.0.1:5199
   ```

3. Before opening a PR, make sure it type-checks:

   ```sh
   npm run typecheck
   ```

## Pull requests

- Keep each PR focused on one change, and describe what it does and why.
- Include a screenshot or short clip for anything visual (the 3D scene, models, UI).
- If you change a Blender model in `assets/blender/`, re-export it to `public/models/` and update its preview in `assets/previews/`.
- For bigger changes, open an issue first so we can talk it through.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
