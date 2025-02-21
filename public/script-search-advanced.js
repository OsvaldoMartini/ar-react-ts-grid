window.onload = function () {
  console.log("Page fully loaded. Collecting elements...");
  startCollectingElements();
};

function startCollectingElements() {
  var searchTerms = ["button", "input", "a", "div"]; // Add relevant selectors
  martiniSearchTerm(searchTerms);
}

function collectIframeElements(doc, searchTerms, collectionFound) {
  // Collect elements from the current document
  searchTerms.forEach((selector) => {
    collectionFound.push(...Array.from(doc.querySelectorAll(selector)));
  });

  // Iterate over iframes and search inside them recursively
  doc.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDocument && iframeDocument.body) {
        console.log(`Processing iframe: ${iframe.src}`);
        collectIframeElements(iframeDocument, searchTerms, collectionFound);
      } else {
        console.warn(`Skipping cross-origin iframe: ${iframe.src}`);
      }
    } catch (e) {
      console.error(`Error accessing iframe: ${iframe.src}`, e);
    }
  });
}

function martiniSearchTerm(searchTerms) {
  let elementInfoMap = new Map();
  let collectionFound = [];

  // Start searching from the main document
  collectIframeElements(document, searchTerms, collectionFound);

  collectionFound.forEach((node) => {
    if (
      ["html", "body", "main", "script", "meta", "head", "style"].includes(
        node.tagName.toLowerCase()
      )
    ) {
      return;
    }

    const elementIdentity = getElementIdentity(node);
    if (elementIdentity) {
      const {
        xpath,
        allAttributes,
        customXPath,
        attribId,
        attribName,
        coords,
        someText,
      } = elementIdentity;
      let elementInfoString = `${node.tagName.toLowerCase()};xpath:${xpath};text:${someText};attribId:${attribId};attribName:${attribName};coords:${coords};allAttributes:${allAttributes};customXPath:${customXPath};`;

      if (!elementInfoMap.has(xpath)) {
        elementInfoMap.set(xpath, elementInfoString);
      }
    }
  });

  console.log("All element info stored in Map:", elementInfoMap);

  return elementInfoMap;
}

function getMartiniXPath(element) {
  if (element === document.body) return "/html/body";
  let ix = 0;
  let siblings = element.parentNode ? element.parentNode.childNodes : [];
  for (let i = 0; i < siblings.length; i++) {
    let sibling = siblings[i];
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      if (sibling === element) {
        return (
          getMartiniXPath(element.parentNode) +
          "/" +
          element.tagName.toLowerCase() +
          "[" +
          (ix + 1) +
          "]"
        );
      }
      ix++;
    }
  }
  return "";
}

function getElementIdentity(element) {
  if (
    element.offsetWidth === 0 ||
    element.offsetHeight === 0 ||
    window.getComputedStyle(element).visibility === "hidden"
  ) {
    return null;
  }

  let xpath = getMartiniXPath(element);
  let allAttributes = Array.from(element.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(";");
  let attribId = element.id || "";
  let attribName = element.name || "";
  let coords = element.getBoundingClientRect();
  coords = `${coords.left},${coords.top}`;
  let someText =
    element.textContent.trim() ||
    (element.tagName.toLowerCase() === "input" ? element.value || "" : "");

  return {
    xpath,
    allAttributes,
    customXPath: "",
    attribId,
    attribName,
    coords,
    someText,
  };
}
