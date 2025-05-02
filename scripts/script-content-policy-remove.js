(function () {
  /**
   * Removes all Content Security Policy meta tags from the document's head and logs their details.
   * @returns {number} - The number of CSP meta tags removed.
   */
  function removeCSPMetaTags() {
    const head = document.head;
    if (!head) {
      console.error(
        "Document does not have a <head> element.  Cannot remove CSP meta tags."
      );
      return 0;
    }

    const cspMetaTags = document.querySelectorAll(
      "meta[http-equiv='Content-Security-Policy']"
    );
    let removedCount = 0;

    cspMetaTags.forEach((tag) => {
      console.log("Removed CSP meta tag:", {
        httpEquiv: tag.httpEquiv,
        content: tag.content, // Log the policy string
        outerHTML: tag.outerHTML,
      });
      head.removeChild(tag);
      removedCount++;
    });

    console.log(`${removedCount} Content Security Policy meta tags removed.`);
    return removedCount;
  }

  // Example usage: Remove all CSP meta tags and log their details
  const numberOfTagsRemoved = removeCSPMetaTags();
  console.log(`Removed ${numberOfTagsRemoved} CSP meta tags.`);
})();
