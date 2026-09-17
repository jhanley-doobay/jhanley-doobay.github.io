module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("posts", (collection) => {
    return collection.getFilteredByGlob("posts/**.*");
  });

  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "_includes/vista-bg.js": "vista-bg.js" });

  eleventyConfig.addNunjucksFilter("tojson", (obj) => JSON.stringify(obj));
};
