module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("posts", (collection) => {
    return collection.getFilteredByGlob("posts/**/*.njk")
      .filter((item) => !item.data.draft && !item.fileSlug.startsWith("_"))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addNunjucksFilter("dateFormat", (date, format) => {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    return `${months[d.getMonth()]} ${day}, ${d.getFullYear()}`;
  });

  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "_includes/vista-bg.js": "vista-bg.js" });

  eleventyConfig.addNunjucksFilter("tojson", (obj) => JSON.stringify(obj));
};
