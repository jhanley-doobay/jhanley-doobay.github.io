module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("posts", (collection) => {
    return collection.getFilteredByGlob("posts/**.*");
  });

  eleventyConfig.addPassthroughCopy({ "images": "images" });
};
