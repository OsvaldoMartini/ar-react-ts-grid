(function () {
  /**
   * Adds a Content Security Policy meta tag to the document's head.
   *
   * @param {string} policyString - The Content Security Policy string.
   * @returns {HTMLMetaElement|null} - The newly created meta element, or null on error.
   */
  function addCSPMetaTag(policyString) {
    if (!policyString) {
      console.error("CSP Policy String is empty.  Cannot add empty policy.");
      return null; // Don't add an empty policy.  That would be bad.
    }

    const head = document.head;
    if (!head) {
      console.error(
        "Document does not have a <head> element.  Cannot add CSP meta tag."
      );
      return null;
    }

    // Check if a CSP meta tag already exists.
    let cspMetaTag = document.querySelector(
      "meta[http-equiv='Content-Security-Policy']"
    );

    if (cspMetaTag) {
      // Update the existing meta tag.
      console.warn(
        "Content Security Policy meta tag already exists. Updating its content."
      );
      cspMetaTag.content = policyString;
      return cspMetaTag;
    } else {
      // Create a new meta tag.
      cspMetaTag = document.createElement("meta");
      cspMetaTag.httpEquiv = "Content-Security-Policy";
      cspMetaTag.content = policyString;
      head.appendChild(cspMetaTag); // Append to the head
      console.log("Content Security Policy meta tag added.");
      return cspMetaTag;
    }
  }

  // Example usage:  Add a restrictive policy.
  const myPolicy =
    "default-src 'self'; script-src 'self'; object-src 'none'; upgrade-insecure-requests;";
  const newMetaTag = addCSPMetaTag(myPolicy);

  if (newMetaTag) {
    console.log("CSP Meta Tag: ", newMetaTag);
  }

  // Example 2: Add a policy that allows connections to ws://localhost:54540
  const allowWebSocketPolicy =
    "default-src 'self'; script-src 'self'; connect-src 'self' ws://localhost:54540; object-src 'none'; upgrade-insecure-requests;";
  const webSocketMetaTag = addCSPMetaTag(allowWebSocketPolicy);
  if (webSocketMetaTag) {
    console.log("CSP Meta Tag for WebSocket: ", webSocketMetaTag);
  }

  // Example 3:  Empty policy (should not add)
  // const emptyTag = addCSPMetaTag("");
  // if (!emptyTag) {
  //   console.log("Empty CSP tag was not added, as expected.");
  // }
})();
