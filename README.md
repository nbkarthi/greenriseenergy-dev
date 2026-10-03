# Greenrise Energy Solutions

Solar EPC company website and blog.

## Blog (Markdown + Jekyll + Pagination)

- **Posts** are in `_posts/` as Markdown (e.g. `2026-02-15-record-low-solar-tariffs-seci.md`) with YAML front matter (title, excerpt, date, categories, tags). The Minimal Mistakes theme renders them at `/blog/YYYY/MM/DD/title/`.
- **Blog index** is built by Jekyll at `/blog/` with **pagination** (15 posts per page) via `jekyll-paginate-v2`. Page 2 is at `/blog/page2/`, etc.
- **Before pushing:** In `_config.yml`, set `repository` to your GitHub repo (e.g. `username/greenriseenergy`).

## Hosting on GitHub Pages

Because the blog uses **jekyll-paginate-v2** (not in GitHub’s default Jekyll plugins), the site must be built with the repo’s Gemfile and deployed via **GitHub Actions**:

1. Push the repo to GitHub.
2. **Settings → Pages** → under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. The workflow in `.github/workflows/jekyll-build-deploy.yml` will run on push to `main`: it runs `bundle exec jekyll build` and deploys the built site.
4. (Optional) Custom domain is set via the `CNAME` file; configure DNS as in [GitHub’s custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

To run the site locally: `bundle install && bundle exec jekyll serve`.
