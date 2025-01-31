const sitemapConfig = require('./next-sitemap.config.js');
const { describe, it, expect } = require('@jest/globals');

describe('next-sitemap.config.js', () => {
  /**
   * This test verifies that the sitemap configuration object has the correct properties
   * and values as defined in the next-sitemap.config.js file.
   */
  it('should have the correct configuration properties', () => {
    expect(sitemapConfig).toEqual({
      siteUrl: "https://jsoncrack.com",
      exclude: ["/widget"],
      autoLastmod: false,
    });
  });
});