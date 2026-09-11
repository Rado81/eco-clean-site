export default function (eleventyConfig) {
  // Static files copied 1:1 into _site/ (paths are relative to the project root).
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // YYYY-MM-DD for sitemap <lastmod>.
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  // services | findBySlug(page.fileSlug) -> the matching entry of services.json
  eleventyConfig.addFilter("findBySlug", (list, slug) => list.find((s) => s.slug === slug));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
