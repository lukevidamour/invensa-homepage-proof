# Invensa homepage, client proof

The homepage design as standalone sites for client review. Potting Shed, job 48190.

- **V1** is at the address plus `v1/`: the approved design, exactly as first shown. The address itself shows V1 too, because that was the first link the client had (`v1/index.html` is the same page, using the root's files).
- **V2** is at the address plus `v2/`: V1 with Invensa's amends of 25 Nov (Red Hat Display throughout, the film in the hero and the animated dots in the closing banner, the nav always visible, a scroll cue, the teams as plain tabs, a lighter cursor over the nav, and three copy changes).
- One password opens both.

- **Password:** Luke has it. It is deliberately not written in this repository, which may be public (to change it, see "Updating" below).
- Hidden from search engines (noindex and robots.txt) and behind a password screen. The password screen keeps casual visitors out; it is not real security, so don't put anything confidential here.
- Links to pages that aren't built yet show a short note instead of going anywhere.

## Put it online (GitHub Desktop)

1. Open **GitHub Desktop**. Choose **File > Add Local Repository…**, click **Choose…**, pick this `invensa-homepage-proof` folder and click **Add Repository**.
2. GitHub Desktop says the folder isn't a Git repository yet. Click **create a repository**, keep the name `invensa-homepage-proof`, and click **Create Repository**.
3. Click **Publish repository**. In **Organization**, pick **Potting Shed** if you can see it (then there's nothing to hand over later), or your own account. GitHub Pages only works on a private repository with a paid plan. If you're not sure, untick **Keep this code private**: the password screen and noindex still keep it out of search and away from casual visitors. Click **Publish Repository**.
4. On github.com, open the repository and go to **Settings > Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, then **Branch** to **main** and **/ (root)**, and click **Save**.
5. After a minute or two, the address appears at the top of that page: `https://<account>.github.io/invensa-homepage-proof/`. Open it, enter the password, and share the links and the password in Basecamp: the address with `v1/` on the end for V1, and with `v2/` for V2.

## Hand it over to Potting Shed's GitHub

If you published it under your own account: on github.com, open the repository's **Settings > General**, scroll to **Danger Zone**, click **Transfer**, and choose the Potting Shed organisation. The address changes to the organisation's, so update the link in Basecamp. Every path in the site is relative, so it keeps working at the new address, or in a subfolder of another repository.

## Updating

The design lives in the main project (`site/explore/` and `site/assets/`). This folder is built from it, so don't edit it by hand.

1. Ask Claude to rebuild the proof, or run `python3 tools/proof/build_proof.py --only v2` from the project folder (`--only v1` for V1, nothing for both).
   - New password: `python3 tools/proof/build_proof.py --password newword`
   - Share image at the published address (do this once you know it): `python3 tools/proof/build_proof.py --url https://<account>.github.io/invensa-homepage-proof/`
2. In GitHub Desktop, type a **Summary** (for example "Proof update, 25 Nov"), click **Commit to main**, then **Push origin**. The site updates within a couple of minutes.

## For Jamie (the build)

- Plain HTML, CSS and vanilla JS, one section per future Astro component (the comments name them). V1 is built from `site/explore/hero-why6.html`; V2 from `site/v2/` (its own copies of every stylesheet and script, each V2 change marked "V2"), in its own `v2/` folder here.
- Fonts (Newsreader, Red Hat Text, Red Hat Display) come from Google Fonts and smooth scrolling from Lenis on unpkg. Self-host both for production.
- Remove for launch: the password screen (marked `PROOF GATE` in the page head, the `.gate` block at the top of `<body>` and its script), the noindex tag, `robots.txt`, and the `data-unbuilt` notes.
- The rules behind the design are in the main project: `docs/design-system.md` and `docs/decisions.md`.

| In this proof | In the main project |
|---|---|
| `index.html` | `site/explore/hero-why6.html` |
| `v1/index.html` | the same page, written by the build from `index.html` |
| `v2/` | `site/v2/` (the same layout as the root) |
| `assets/css/main.css` | `site/explore/main-v2.css` |
| `assets/css/motion.css` | `site/explore/motion-v2.css` |
| `assets/css/brand.css` | `site/explore/brand-v2.css` |
| `assets/css/why.css` | `site/explore/why-options.css` |
| `assets/css/pressure-anims.css` | `site/assets/css/pressure-anims.css` |
| `assets/js/main.js` | `site/assets/js/main.js` |
| `assets/js/motion.js` | `site/explore/motion-v2.js` |
| `assets/js/precision-points.js` | `site/explore/precision-points-v2.js` |
| `assets/js/pressure-anims.js` | `site/explore/pressure-anims-v2.js` |
| `assets/js/why.js` | `site/explore/why-options.js` |
| `assets/js/who-scroll.js` | `site/explore/who-scroll.js` |
| `assets/img`, `assets/logos`, `assets/video` | the same paths under `site/assets/` |
