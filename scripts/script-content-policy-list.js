(function () {
  /**
   * Logs all Content Security Policy related meta tags from the document's head.
   * @returns {number} - The number of CSP meta tags found.
   */
  function logCSPMetaTags() {
    const head = document.head;
    if (!head) {
      console.error(
        "Document does not have a <head> element. Cannot log CSP meta tags."
      );
      return 0;
    }

    // Find all meta tags.
    const metaTags = document.querySelectorAll("meta");
    let cspMetaTagsCount = 0;

    metaTags.forEach((tag) => {
      // Check if the meta tag is related to Content Security Policy.
      if (
        tag.httpEquiv === "Content-Security-Policy" ||
        tag.name === "Content-Security-Policy"
      ) {
        console.log("CSP meta tag found:", {
          httpEquiv: tag.httpEquiv, // Could be "Content-Security-Policy" or null
          name: tag.name, //Could be "Content-Security-Policy" or null
          content: tag.content,
          outerHTML: tag.outerHTML,
        });
        cspMetaTagsCount++;
      }
    });

    console.log(`${cspMetaTagsCount} Content Security Policy meta tags found.`);
    return cspMetaTagsCount;
  }

  // Example usage: Log all CSP meta tags
  const numberOfTagsFound = logCSPMetaTags();
  console.log(`Found ${numberOfTagsFound} CSP meta tags.`);
})();
