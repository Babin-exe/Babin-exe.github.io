# Babin's portfolio

A static portfolio and a set of technical project notes, built with plain HTML, CSS, and JavaScript. There is no package manager, build step, or framework.

## Project structure

- `index.html` — homepage and GitHub Pages entry point
- `assets/css/site.css` — shared site styles
- `assets/js/site.js` — shared interactions
- `projects/` — project walkthroughs
- `notes/` — technical articles and interactive examples
- `.nojekyll` — tells GitHub Pages to serve the files as-is

## Preview locally

From this folder, run `python3 -m http.server 8000` and open `http://localhost:8000`.

## Publish with GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, then select `main` and `/(root)`. Push changes to `main` to update the site.
