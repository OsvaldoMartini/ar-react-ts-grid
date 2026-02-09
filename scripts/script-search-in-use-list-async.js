// SEARCH IN USE (SENDER: scannerTool) -> UPDATE_LIST_ELEMENTS
const __done = arguments[arguments.length - 1];

(function (
  searchTerms,
  hiddenFields,
  socketPort,
  sessionId,
  destination,
  operationId,
  homeBankingId,
  botJobId,
) {
  // --- NEW: Selenium async callback handling ---
  let __doneCalled = false;
  function doneOnce(payload) {
    if (__doneCalled) return;
    __doneCalled = true;
    __done(JSON.stringify(payload));
  }

  // Safety timeout so Java never waits forever (adjust seconds as you want)
  setTimeout(
    () => doneOnce({ ok: false, error: "timeout waiting for JS completion" }),
    20000,
  );

  // --- NEW: stop any previous injected instance ---
  try {
    if (typeof window.__scannerToolCleanup === "function") {
      window.__scannerToolCleanup(); // stop previous run
    }
  } catch (e) {}

  // keep reference to *this* run cleanup (assigned later)
  window.__scannerToolCleanup = null;

  // Minimal cleanup for non-WS version
  const cleanup = () => {};
  window.__scannerToolCleanup = cleanup;
  window.addEventListener("beforeunload", cleanup, { once: true });

  window.elementInfoMap = new Map();
  // window.searchTerms = ["button", "input", "a", "select"];
  window.searchTerms = searchTerms;
  window.allElementInfo = [];
  window.destination = destination;
  window.operationId = operationId;
  window.homeBankingId = homeBankingId;
  window.botJobId = botJobId;
  window.sessionId = `${sessionId}`; // -${homeBankingId}`;
  // var elementInfoSubmit = new Map();

  let started = false;

  function init(eventName) {
    if (started) return;

    const ready =
      [
        "DOMContentLoaded",
        "onreadystatechange",
        "load",
        "onload",
        "Direct Execution",
      ].includes(eventName) ||
      ["complete", "interactive"].includes(document.readyState);

    if (!ready) return;

    started = true;

    try {
      startCollectingElements(window.searchTerms);
    } catch (e) {
      doneOnce({
        ok: false,
        error: "startCollectingElements failed",
        message: String(e?.message || e),
        stack: String(e?.stack || ""),
      });
    }
  }

  // Function to collect general elements based on search terms
  const collectElements = function collectElements(
    doc,
    searchTerms,
    collectionFound,
  ) {
    // Collect elements from the current document using the provided search terms
    if (searchTerms.length > 0) {
      searchTerms.forEach((selector) => {
        // If search term includes "with id", filter only elements that have an "id" attribute
        if (selector.includes("with id")) {
          collectionFound.push(...Array.from(doc.querySelectorAll("[id]")));
        }
        // If search term includes "with name", filter only elements that have a "name" attribute
        else if (selector.includes("with name")) {
          collectionFound.push(...Array.from(doc.querySelectorAll("[name]")));
        }
        // If search term includes "with test-id", filter only elements that have a "test-id" attribute
        else if (selector.includes("with test-id")) {
          collectionFound.push(
            ...Array.from(doc.querySelectorAll("[test-id]")),
          );
        } else {
          collectionFound.push(...Array.from(doc.querySelectorAll(selector)));
        }
      });
    } else {
      // Collect all elements except iframes
      collectionFound.push(
        ...Array.from(doc.querySelectorAll("*")).filter(
          (el) => el.tagName.toLowerCase() !== "iframe",
        ),
      );
    }

    // After collecting, process element identities for the parent document
    collectionFound.forEach((element) => {
      if (
        ["html", "body", "main", "script", "meta", "head", "style"].includes(
          element.tagName.toLowerCase(),
        )
      ) {
        return;
      }

      const elementIdentity = getElementIdentity(element);
      if (elementIdentity) {
        filterSearchTerms(
          element,
          "tagName-Found",
          elementIdentity.xPath,
          elementIdentity,
          searchTerms,
        );
      }
    });
  };

  function filterSearchTerms(
    element,
    typeDTO,
    referXPath,
    elementIdentity,
    searchTerms,
  ) {
    if (
      searchTerms.length === 0 ||
      (!searchTerms.includes("with id") &&
        !searchTerms.includes("with name") &&
        !searchTerms.includes("with text") &&
        !searchTerms.includes("with test-id"))
    ) {
      // Check if the clicked element has a shadow root
      let shadowHost = null;

      // If element is inside an OPEN shadow root, jump directly to the host
      const root = element.getRootNode && element.getRootNode();
      if (root && root instanceof ShadowRoot) {
        shadowHost = root.host;
      } else {
        // Fallback: walk up light DOM to find a host that owns a shadow root
        shadowHost = element;
        while (shadowHost && !shadowHost.shadowRoot) {
          shadowHost = shadowHost.parentElement;
        }
      }

      if (shadowHost && shadowHost.shadowRoot) {
        // Access the Shadow DOM
        const shadowRoot = shadowHost.shadowRoot;

        // Find all clickable elements inside the Shadow DOM
        let clickableElements = findClickableElements(shadowRoot);

        // If clickable elements are found, perform your action (e.g., highlight them)
        clickableElements.forEach((shadowEl) => {
          const shadowElIdentity = getElementIdentity(shadowEl);
          if (!shadowElIdentity) return;

          pushElement(
            shadowEl,
            shadowElIdentity,
            shadowElIdentity.xPath,
            typeDTO,
            shadowHost,
            shadowRoot,
          );
        });
      } else {
        // If no search terms, directly add the element
        pushElement(element, elementIdentity, referXPath, typeDTO, null, null);
      }
      // window.elementInfoMap.set(
      //   referXPath,
      //   elementDTO(typeDTO, elementIdentity)
      // );
      return;
    }
    // Iterate through search terms and apply corresponding checks
    searchTerms.forEach((term) => {
      let matches = false;

      if (
        term.includes("with id") &&
        elementIdentity.attributeData.some((attr) => attr.name === "id")
      ) {
        matches = true;
      } else if (
        term.includes("with name") &&
        elementIdentity.attributeData.some((attr) => attr.name === "name")
      ) {
        matches = true;
      } else if (
        term.includes("with text") &&
        elementIdentity.someText.length > 0
      ) {
        matches = true;
      }

      // If a match is found, set the element in the map
      if (matches) {
        // Check if the clicked element has a shadow root
        let shadowHost = null;

        // If element is inside an OPEN shadow root, jump directly to the host
        const root = element.getRootNode && element.getRootNode();
        if (root && root instanceof ShadowRoot) {
          shadowHost = root.host;
        } else {
          // Fallback: walk up light DOM to find a host that owns a shadow root
          shadowHost = element;
          while (shadowHost && !shadowHost.shadowRoot) {
            shadowHost = shadowHost.parentElement;
          }
        }

        if (shadowHost && shadowHost.shadowRoot) {
          // Access the Shadow DOM
          const shadowRoot = shadowHost.shadowRoot;

          // Find all clickable elements inside the Shadow DOM
          let clickableElements = findClickableElements(shadowRoot);

          // If clickable elements are found, perform your action (e.g., highlight them)
          clickableElements.forEach((shadowEl) => {
            const shadowElIdentity = getElementIdentity(shadowEl);
            if (!shadowElIdentity) return;

            pushElement(
              shadowEl,
              shadowElIdentity,
              shadowElIdentity.xPath,
              typeDTO,
              shadowHost,
              shadowRoot,
            );
          });
        } else {
          // If no search terms, directly add the element
          pushElement(
            element,
            elementIdentity,
            referXPath,
            typeDTO,
            null,
            null,
          );
        }
        // window.elementInfoMap.set(
        //   referXPath,
        //   elementDTO(typeDTO, elementIdentity)
        // );
      }
    });
  }

  // Function to find clickable elements (buttons, links, etc.)
  function findClickableElements(root) {
    const clickableSelectors = ["button", "a"]; // Add other clickable elements if needed
    const clickableElements = [];
    clickableSelectors.forEach((selector) => {
      clickableElements.push(...root.querySelectorAll(selector));
    });
    return clickableElements;
  }

  function fetchAndParseIframeContent(iframe) {
    try {
      if (!iframe.src) return null;
      // optionally: only same-origin
      const url = new URL(iframe.src, window.location.href);
      if (url.origin !== window.location.origin) return null;

      const xhr = new XMLHttpRequest();
      xhr.open("GET", iframe.src, false);
      xhr.send();
      if (xhr.status !== 200) return null;

      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(
        xhr.responseText,
        "text/html",
      );
      return parsedDocument.querySelectorAll("*");
    } catch (e) {
      return null;
    }
  }

  const iFrameDetails = function iFrameDetails(iframe, xPathIFrame, childSize) {
    const iframeDetails = `Elements inside iframe: ${childSize}`;

    console.log(
      `iFrame Found: ${
        iframe.src ||
        iframe.title ||
        iframe.id ||
        iframe.name ||
        "No description"
      }; ${iframeDetails}`,
    );
    // Store the iframe details in the elementInfoMap
    elementInfoMap.set(
      xPathIFrame,
      `xpath:${xPathIFrame};text:${
        iframe.src ||
        iframe.title ||
        iframe.id ||
        iframe.name ||
        "No description"
      };${iframeDetails}`,
    );
  };

  // NEW: collect Shadow DOM elements recursively (open shadow roots only)
  function collectShadowElements(rootNode, searchTerms) {
    try {
      // Find potential shadow hosts in the current light DOM tree
      const hosts = rootNode.querySelectorAll("*");

      hosts.forEach((host) => {
        if (!host || !host.shadowRoot) return; // only OPEN shadow roots

        const shadowRoot = host.shadowRoot;

        // Reuse your existing clickable finder (or broaden if you want)
        const clickable = findClickableElements(shadowRoot);

        clickable.forEach((shadowEl) => {
          const shadowElIdentity = getElementIdentity(shadowEl);
          if (!shadowElIdentity) return;

          filterSearchTerms(
            shadowEl,
            "Shadow-Child",
            shadowElIdentity.xPath,
            shadowElIdentity,
            searchTerms,
          );

          // Ensure it gets shadowHost/shadowRoot fields like your previous code
          // filterSearchTerms will call pushElement with shadowHost/shadowRoot
          // because shadowEl is inside a shadow root
        });

        // IMPORTANT: nested shadow roots inside this shadowRoot
        // We need to walk inside it to find more hosts.
        collectShadowElements(shadowRoot, searchTerms);
      });
    } catch (e) {
      // swallow to keep scanner robust
    }
  }

  // Function to collect iframe elements recursively
  const collectIframeElements = function collectIframeElements(
    doc,
    collectionFound,
    isIframeChild = false,
  ) {
    doc.querySelectorAll("iframe").forEach((iframe) => {
      try {
        let iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;

        // NEW: collect Shadow DOM elements inside iframe (same-origin only)
        collectShadowElements(iframeDocument, searchTerms);

        try {
          //console.log("Iframe origin:",new URL(iframe.src, window.location.origin).origin);
          //console.log("Parent origin:", window.location.origin);
        } catch (e) {
          //console.log("Cross-origin access denied for iframe:", iframe.src);
        }

        if (iframe) {
          let iframeParsed = null;
          let srcDocElements = null;

          const xPathIFrame = getMartiniXPath(iframe); // Get the XPath of the iframe

          const elementIdentity = getElementIdentity(iframe);
          if (elementIdentity) {
            filterSearchTerms(
              iframe,
              "iFrame-Found",
              elementIdentity.xPath,
              elementIdentity,
              searchTerms,
            );
          }

          const parser = new DOMParser();

          if (iframe.srcdoc) {
            iframeParsed = parser.parseFromString(iframe.srcdoc, "text/html");

            // Select all elements inside the parsed document
            srcDocElements = iframeParsed.querySelectorAll("*");
          }

          if (iframe.src) {
            const srcElements = fetchAndParseIframeContent(iframe);
            if (srcElements) {
              // console.log("Fetched Elements:", srcElements);

              iFrameDetails(iframe, xPathIFrame, srcElements.length);

              srcElements.forEach(function (element) {
                const elementIdentity = getElementIdentity(element);
                // console.log(
                //   "elementIdentity.xPath",
                //   `${xPathIFrame}${elementIdentity?.xPath}`
                // );
                if (elementIdentity) {
                  elementIdentity.iFrameXPath = xPathIFrame;
                  filterSearchTerms(
                    element,
                    "iFrame-Child",
                    `${xPathIFrame}${elementIdentity?.xPath}`,
                    elementIdentity,
                    searchTerms,
                  );
                }
              });
            }
          }

          // Collect all elements inside the iframe
          if (!iframe.src) {
            iFrameDetails(
              iframe,
              xPathIFrame,
              srcDocElements
                ? srcDocElements.length
                : iframeDocument
                  ? iframeDocument.querySelectorAll("*").length
                  : 0,
            );
          }

          iframeDocument
            .querySelectorAll("*")
            .forEach(function (elementInsideIframe) {
              const elementIdentity = getElementIdentity(elementInsideIframe);

              // console.log(
              //   "elementIdentity.xPath",
              //   `${xPathIFrame}${elementIdentity?.xPath}`
              // );
              if (elementIdentity) {
                elementIdentity.iFrameXPath = xPathIFrame;
                filterSearchTerms(
                  elementInsideIframe,
                  "iFrame-Child",
                  `${xPathIFrame}${elementIdentity?.xPath}`,
                  elementIdentity,
                  searchTerms,
                );
              }
            });

          // Loop through all the elements and extract their properties
          srcDocElements?.forEach(function (element) {
            const elementIdentity = getElementIdentity(element);
            // console.log(
            //   "elementIdentity.xPath",
            //   `${xPathIFrame}${elementIdentity?.xPath}`
            // );
            if (elementIdentity) {
              elementIdentity.iFrameXPath = xPathIFrame;
              filterSearchTerms(
                element,
                "iFrame-Child",
                `${xPathIFrame}${elementIdentity?.xPath}`,
                elementIdentity,
                searchTerms,
              );
            }
          });

          // Process iframe content depending on the presence of srcdoc
          if (iframeParsed) {
            processIframeElements(iframeParsed, xPathIFrame);
          }

          // If the iframe contains nested iframes, recursively collect them
          collectIframeElements(iframeDocument, collectionFound, true);
        } else {
          // console.log(`Skipping cross-origin iframe: ${iframe.src}`);
        }
      } catch (e) {
        // console.error(`Error accessing iframe: ${iframe.src || "Unknown iframe"}`, e);
      }
    });
  };

  const processIframeElements = function (iframeDocument, xPathIFrame) {
    // Collect all elements inside the iframe
    iframeDocument
      .querySelectorAll("*")
      .forEach(function (elementInsideIframe) {
        const elementIdentity = getElementIdentity(elementInsideIframe);

        // console.log(
        //   "elementIdentity.xPath",
        //   `${xPathIFrame}${elementIdentity?.xPath}`
        // );
        if (elementIdentity) {
          elementIdentity.iFrameXPath = xPathIFrame;
          filterSearchTerms(
            elementInsideIframe,
            "iFrame-Child",
            `${xPathIFrame}${elementIdentity?.xPath}`,
            elementIdentity,
            searchTerms,
          );
        }
      });
  };

  // Function to initialize the collection process
  const startCollectingElements = function startCollectingElements(
    searchTerms,
  ) {
    // const searchTerms = ["button", "input", "a", "div"]; // Define elements to search for
    window.elementInfoMap = new Map(); // Initialize the map to store element information
    let collectionFound = [];

    // First, collect iframe elements
    collectIframeElements(document, collectionFound, elementInfoMap);

    // Then, collect shadow DOM elements in the top document
    collectShadowElements(document, searchTerms);

    // Then, collect general elements based on search terms
    collectElements(document, searchTerms, collectionFound, elementInfoMap);

    window.allElementInfo = [];

    collectionFound = getResultMap(window.elementInfoMap);
    // console.log("All Collection Found :", collectionFound);

    const sameXPathFound = processElementsWithXPath(collectionFound);
    // console.log("processElementsWithXPath", sameXPathFound);

    const noRepeatedItems = findUniqueAndOneRepeated(sameXPathFound);
    // console.log("noRepeatedItems", noRepeatedItems); // Output the items with repetitions

    // Define the order
    const order = [
      "input",
      "textarea",
      "button",
      "a",
      "select",
      "label",
      "span",
      "div",
    ];

    // Create the final list based on the specified order
    const sortedList = order.reduce((acc, type) => {
      const filteredElements = noRepeatedItems.filter((item) => {
        // For "label", "span", and "div", check if someText is not empty
        if (["label", "span", "div"].includes(type)) {
          return item.tagName === type && item.someText?.trim() !== "";
        }
        // For other types, no need to check someText
        return item.tagName === type;
      });

      return [...acc, ...filteredElements];
    }, []);

    // console.log("sortedList", sortedList);

    findMatLabel(sortedList);

    changeDivToLabelWithSomeText(sortedList);

    limitMapSize(sortedList);
    // console.log("All element info stored in Map:", window.allElementInfo);
    window.elementInfoMap.clear();

    // Return full list to Java once (no websocket, no chunks)
    doneOnce({
      ok: true,
      elements: window.allElementInfo,
      totalElements: window.allElementInfo.length,
    });
  };

  function pushElement(
    element,
    elementIdentityTemp,
    referXPath,
    typeDTO,
    shadowHost,
    shadowRoot,
  ) {
    let shadowHostSelector = "";
    let elementCssSelector = "";
    let shadowPath = [];

    function buildCssSelector(el) {
      if (!el) return "";

      let selector = el.tagName.toLowerCase();

      if (el.id) selector += `#${el.id}`;

      // Ensure className is treated as a string
      if (el.className && typeof el.className === "string") {
        selector += `.${el.className.replace(/\s+/g, ".")}`;
      }

      return selector;
    }

    // Traverse shadow hosts if nested shadow DOM exists
    let currentHost = shadowHost;
    while (currentHost) {
      shadowPath.unshift(buildCssSelector(currentHost));
      currentHost =
        currentHost.parentNode instanceof ShadowRoot
          ? currentHost.parentNode.host
          : null;
    }

    if (shadowHost) {
      shadowHostSelector = buildCssSelector(shadowHost);
    }

    if (element) {
      elementCssSelector = buildCssSelector(element);
    }

    // Construct the natural CSS selector for nested Shadow DOM
    let cssSelector = elementCssSelector;

    // Build nested CSS selector, if shadowPath is not empty.
    if (shadowPath.length > 0) {
      cssSelector = shadowPath.reduceRight((acc, hostSelector) => {
        return `${hostSelector} ${acc}`;
      }, elementCssSelector);
    }

    const elementIdentity = {
      ...elementIdentityTemp,
      shadowHost: shadowHostSelector,
      shadowRoot: String(!!shadowRoot), // "true" or "false"
      nestedShadow: String(shadowPath.length > 1), // Detects if multiple shadow roots are involved
      cssSelector: elementCssSelector, // cssSelector shadowRoot
    };

    // ✅ compute names here
    const names = defineNameTitlesJs(elementIdentity) || {
      nameLabel: "",
      nameField: "",
      definedName: "",
    };

    // Store tagName and other details in the Map
    if (elementIdentity) {
      window.elementInfoMap.set(
        referXPath, // Keep Distinction iFrameXPath / child / etc...
        elementDTO(typeDTO, elementIdentity, names),
      );
    }
  }

  const getElementIdentity = function getElementIdentity(element) {
    if (!hiddenFields) {
      if (
        (element.offsetWidth === 0 ||
          element.offsetHeight === 0 ||
          window.getComputedStyle(element).visibility === "hidden") &&
        !(
          element.tagName.toLowerCase() === "input" &&
          element.type.toLowerCase() === "hidden"
        )
      ) {
        return null; // Ignore all hidden elements except <input type="hidden">
      }
    }

    const attributeData = Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));
    const attribId = element.id || "";
    const attribName = element.name || "";
    const coordinates = `${element
      .getBoundingClientRect()
      .left.toFixed(2)},${element.getBoundingClientRect().top.toFixed(2)}`;

    let tagName = element.tagName.toLowerCase();

    const someText = getVisibleText(tagName, attributeData, element);

    const xPath = getMartiniXPath(element);

    const tagNameTemp = identifyElementTypeFromXPath(tagName, xPath, someText);
    if (tagNameTemp !== tagName) {
      tagName = tagNameTemp;
    }

    return {
      xPath,
      tagName,
      attributeData,
      customXPath: "",
      attribId,
      attribName,
      coordinates,
      someText,
    };
  };

  // Function to check if an element is hidden (using computed styles and attributes)
  const isHidden = (el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display === "none" ||
      style.visibility === "hidden" ||
      el.hasAttribute("aria-hidden")
    );
  };

  function getVisibleText(tagName, attributeData, element) {
    let textResult = "";

    if (element && !isHidden(element)) {
      const extractedText = extractVisibleTextFromHTML(element);
      textResult = [
        ...extractedText.titles,
        ...extractedText.text,
        ...extractedText.labels,
      ]
        .map((text) => text.trim())
        .filter(Boolean)
        .join("; ");
    }

    // Define priority order for attributes
    const attributePriority = [
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "textarea",
      "input",
      "select",
      "placeholder",
      "label",
      "name",
      "title",
      "alt",
      "for",
      "data-label",
      "data-name",
      "data-title",
      "id",
      "data-testid",
    ];

    let firstMeaningfulText = "";

    // Function to get attribute text with priority
    const getAttributeText = (name, value) => {
      if (name === "aria-labelledby" || name === "aria-describedby") {
        const referencedElement = document.getElementById(value);
        if (referencedElement && !isHidden(referencedElement)) {
          return referencedElement.textContent.trim();
        }
      }
      return value.trim();
    };

    // Check element's text first
    if (textResult && !/^\..*\{.*\}$/.test(textResult)) {
      firstMeaningfulText = textResult;
    } else {
      // Directly prioritize title before checking others
      const titleAttr = attributeData.find(({ name }) => name === "title");
      if (titleAttr) {
        firstMeaningfulText = getAttributeText(titleAttr.name, titleAttr.value);
      }

      if (!firstMeaningfulText) {
        for (const attr of attributePriority) {
          const foundAttr = attributeData.find(({ name }) => name === attr);
          if (foundAttr) {
            firstMeaningfulText = getAttributeText(
              foundAttr.name,
              foundAttr.value,
            );
            if (firstMeaningfulText) break; // Stop at first meaningful attribute
          }
        }
      }
    }

    return firstMeaningfulText; // Return the most meaningful text
  }

  function extractVisibleTextFromHTML(element) {
    if (!element) {
      return { text: [], labels: [], titles: [] };
    }

    const result = {
      text: new Set(),
      labels: new Set(),
      titles: new Set(),
    };

    // Utility function to check if an element is visible
    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      return !(
        style.display === "none" ||
        style.visibility === "hidden" ||
        el.hasAttribute("aria-hidden")
      );
    };

    // Function to filter out technical patterns
    const isTechnicalPattern = (word) => {
      return word.includes("_") || word.includes("--") || word.includes("-");
    };

    // Extract visible text content from an element
    if (element.textContent?.trim() && isVisible(element)) {
      // Ignore text content that looks like CSS rules and words with technical patterns
      const textContent = element.textContent.trim();
      const words = textContent.split(/\s+/);
      const filteredWords = words.filter((word) => !isTechnicalPattern(word));
      const filteredText = filteredWords.join(" ").trim();
      if (filteredText) {
        result.text.add(filteredText);
      }
    }

    // Extract text from labels (including associated input fields)
    element.querySelectorAll("label").forEach((label) => {
      if (isVisible(label) && label.textContent?.trim()) {
        result.labels.add(label.textContent.trim());
      }

      // Handle labels associated with form elements
      const forAttr = label.getAttribute("for");
      if (forAttr) {
        const inputElement = document.getElementById(forAttr);
        if (inputElement && isVisible(inputElement)) {
          const value = inputElement.value?.trim();
          const placeholder = inputElement.placeholder?.trim();
          if (value) {
            const words = value.split(/\s+/);
            const filteredWords = words.filter(
              (word) => !isTechnicalPattern(word),
            );
            const filteredText = filteredWords.join(" ").trim();
            if (filteredText) result.text.add(filteredText);
          } else if (placeholder) {
            const words = placeholder.split(/\s+/);
            const filteredWords = words.filter(
              (word) => !isTechnicalPattern(word),
            );
            const filteredText = filteredWords.join(" ").trim();
            if (filteredText) result.text.add(filteredText);
          }
        }
      }
    });

    // Extract text from common inline and block elements
    const visibleTextElements = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "span",
      "div",
      "strong",
      "em",
      "b",
      "i",
      "blockquote",
    ];
    visibleTextElements.forEach((tag) => {
      element.querySelectorAll(tag).forEach((child) => {
        if (isVisible(child) && child.textContent?.trim()) {
          const textContent = child.textContent.trim();
          const words = textContent.split(/\s+/);
          const filteredWords = words.filter(
            (word) => !isTechnicalPattern(word),
          );
          const filteredText = filteredWords.join(" ").trim();
          if (filteredText) {
            result.text.add(filteredText);
          }
        }
      });
    });

    // Extract visible link text
    element.querySelectorAll("a").forEach((link) => {
      if (isVisible(link) && link.textContent?.trim()) {
        const textContent = link.textContent.trim();
        const words = textContent.split(/\s+/);
        const filteredWords = words.filter((word) => !isTechnicalPattern(word));
        const filteredText = filteredWords.join(" ").trim();
        if (filteredText) {
          result.text.add(filteredText);
        }
      }
    });

    // Extract titles from iframes if accessible
    element.querySelectorAll("iframe").forEach((iframe) => {
      if (iframe.hasAttribute("title")) {
        const title = iframe.getAttribute("title")?.trim();
        if (title) result.titles.add(title);
      }

      try {
        const iframeDoc =
          iframe.contentDocument ||
          new DOMParser().parseFromString(iframe.srcdoc || "", "text/html");
        if (iframeDoc.body) {
          const extractedText = extractVisibleTextFromHTML(iframeDoc.body);
          extractedText.titles.forEach((title) => result.titles.add(title));
          extractedText.text.forEach((text) => result.text.add(text));
          extractedText.labels.forEach((label) => result.labels.add(label));
        }
      } catch (e) {
        console.log("Could not access iframe content", e);
      }
    });

    // Return arrays instead of Sets
    return {
      text: Array.from(result.text),
      labels: Array.from(result.labels),
      titles: Array.from(result.titles),
    };
  }
  // Helper function to generate a unique XPath for an element
  const getMartiniXPath = function getMartiniXPath(element) {
    if (element === document.body) return "/html/body";
    let ix = 0;
    const siblings = element.parentNode ? element.parentNode.childNodes : [];
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
  };

  function identifyElementTypeFromXPath(tagName, xpath) {
    if (typeof xpath !== "string" || xpath.trim() === "") {
      return "unknown";
    }

    const parts = xpath.split("/").filter((part) => part.trim() !== "");

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];

      const tagMatch = part.match(/^([a-zA-Z-]+)(?:\[\d+\])?/);
      if (!tagMatch) continue;

      const tag = tagMatch[1].toLowerCase();

      if (tag === "a") {
        return "a"; // Link
      }

      if (tag === "input") {
        const typeMatch = part.match(/@type=["']?([^"'\]]+)["']?/);
        const type = typeMatch ? typeMatch[1].toLowerCase() : "";

        if (["button", "submit", "reset"].includes(type)) {
          return "button";
        }
        return "input";
      }

      if (tag === "button") {
        return "button";
      }

      // Detect if it's an Angular Material expansion panel (likely a button)
      if (
        tag.includes("expansion-panel-header") ||
        tag.includes("sidenav") ||
        tag.includes("nav")
      ) {
        return "button";
      }

      if (tag === "select" || tag === "option") {
        return "select"; // or option
      }

      if (tag === "textarea") {
        return "input";
      }

      // Framework specific detection from isInteractiveElement function.
      if (
        tag.includes("mat-button") ||
        tag.includes("mat-raised-button") ||
        tag.includes("mat-icon-button") ||
        tag.includes("mat-menu-item") ||
        tag.includes("mat-select") ||
        tag.includes("mat-option") ||
        tag.includes("matinput")
      ) {
        return "button"; // or select, input, option.
      }

      if (
        tag.includes("data-testid") ||
        tag.includes("aria-label") ||
        part.includes("@role='button'") ||
        part.includes("@role='textbox'") ||
        part.includes("react-button") ||
        part.includes("react-link") ||
        part.includes("react-input")
      ) {
        if (part.includes("react-input")) {
          return "input";
        } else if (part.includes("react-link")) {
          return "a";
        } else {
          return "button";
        }
      }

      if (
        part.includes("mdc-button") ||
        part.includes("mdc-text-field") ||
        part.includes("mdc-list-item")
      ) {
        if (part.includes("mdc-text-field")) {
          return "input";
        } else {
          return "button";
        }
      }

      if (
        part.includes("el-button") ||
        part.includes("el-input__inner") ||
        part.includes("el-select-dropdown__item")
      ) {
        if (part.includes("el-input__inner")) {
          return "input";
        } else if (part.includes("el-select-dropdown__item")) {
          return "select";
        } else {
          return "button";
        }
      }
    }

    return tagName; // Default to the given tagName if no match
  }

  const elementDTO = function elementDTO(typeElement, identity, names) {
    return {
      typeElement: typeElement,
      tagName: identity.tagName ?? "No Tag Name Detected",
      xPath: identity.xPath ?? "",
      someText: identity.someText ?? "",
      attribId: identity.attribId ?? "",
      attribName: identity.attribName ?? "",
      coordinates: identity.coordinates ?? "",
      attributeData: identity.attributeData ?? "",
      customXPath: identity.customXPath ?? "",
      iFrameXPath: identity.iFrameXPath ?? "",
      shadowHost: identity.shadowHost ?? "",
      shadowRoot: identity.shadowRoot ?? "",
      nestedShadow: identity.nestedShadow ?? "",
      cssSelector: identity.cssSelector ?? "",
      attributeValue: identity.attributeValue ?? "",
      attributeType: identity.attributeType ?? "",
      searchAttributeValue: identity.searchAttributeValue ?? "",
      // NEW FIELDS (match your TargetElement fields)
      // ✅ safe
      nameLabel: names?.nameLabel ?? "",
      nameField: names?.nameField ?? "",
      definedName: names?.definedName ?? "",
    };
  };

  function getResultMap(elementInfoMap) {
    let collectionMap = [];
    elementInfoMap.forEach((value, key) => {
      let modifiedValue = value;
      collectionMap.push(modifiedValue);
    });
    return collectionMap;
  }

  const processElementsWithXPath = (elementsList) => {
    const groupedElements = new Map();

    // Helper function to parse XPath into an array of tags and indices
    const parseXPath = (xPath) => {
      return xPath
        .split("/")
        .filter((part) => part)
        .map((part) => {
          const match = part.match(/([a-zA-Z]+)(?:\[(\d+)\])?/);
          if (match) {
            return {
              tagName: match[1],
              index: match[2] ? parseInt(match[2]) : null,
            };
          }
          return null;
        })
        .filter((item) => item !== null);
    };

    // Helper function to determine if two XPaths belong to the same component
    const areSameComponent = (xpath1, xpath2) => {
      const path1 = parseXPath(xpath1);
      const path2 = parseXPath(xpath2);

      if (path1.length === 0 || path2.length === 0) {
        return false;
      }

      // Check if the paths have the same base part (up to the "a" tag)
      let commonLength = 0;
      for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
        if (
          path1[i].tagName === path2[i].tagName &&
          path1[i].index === path2[i].index
        ) {
          if (path1[i].tagName === "a") {
            commonLength = i + 1;
            break;
          }
        } else {
          break;
        }
      }

      if (commonLength === 0) {
        return false;
      }

      return path1.slice(0, commonLength).every((item, index) => {
        return (
          item.tagName === path2[index].tagName &&
          item.index === path2[index].index
        );
      });
    };

    elementsList.forEach((element) => {
      if (element.xPath && element.coordinates) {
        let foundGroup = false;
        for (const [key, group] of groupedElements) {
          if (
            areSameComponent(element.xPath, key) &&
            element.coordinates === group[0].coordinates
          ) {
            group.push(element);
            foundGroup = true;
            break;
          }
        }
        if (!foundGroup) {
          groupedElements.set(element.xPath, [element]);
        }
      }
    });

    const filteredResult = [];

    groupedElements.forEach((group) => {
      if (group.length > 1) {
        // Find the element with the "highest" coordinates (assuming higher means further down/right)
        let highestCoordinateElement = group[0];
        group.forEach((element) => {
          const [x, y] = element.coordinates.split(",").map(parseFloat);
          const [highestX, highestY] = highestCoordinateElement.coordinates
            .split(",")
            .map(parseFloat);
          if (y > highestY || (y === highestY && x > highestX)) {
            highestCoordinateElement = element;
          }
        });
        filteredResult.push(highestCoordinateElement);
      } else {
        filteredResult.push(group[0]);
      }
    });

    return filteredResult;
  };

  const findUniqueAndOneRepeated = (elementsList) => {
    const wordFrequency = new Map();
    const wordToItems = new Map();
    const coordinatesMap = new Map();

    elementsList.forEach((element) => {
      if (
        element.tagName.toLowerCase() !== "span" &&
        element.tagName.toLowerCase() !== "div" &&
        element.tagName.toLowerCase() !== "button"
      ) {
        return; // Ignore elements that are not <span>, <div>, or button
      }

      const someText = element.someText?.trim();
      if (someText) {
        someText.split(/[\s,;]+/).forEach((word) => {
          const trimmedWord = word.trim();
          if (trimmedWord) {
            wordFrequency.set(
              trimmedWord,
              (wordFrequency.get(trimmedWord) || 0) + 1,
            );

            if (!wordToItems.has(trimmedWord)) {
              wordToItems.set(trimmedWord, new Set());
            }
            wordToItems.get(trimmedWord).add(element);
          }
        });
      }

      // Store elements by their coordinates
      if (element.coordinates) {
        if (!coordinatesMap.has(element.coordinates)) {
          coordinatesMap.set(element.coordinates, []);
        }
        coordinatesMap.get(element.coordinates).push(element);
      }
    });

    // Resolve elements with same coordinates, prioritizing "aria-label"
    coordinatesMap.forEach((elements) => {
      let priorityElement = elements.find((el) =>
        el.attributeData?.some((attr) => attr.name === "aria-label"),
      );
      if (priorityElement) {
        const ariaLabelAttr = priorityElement.attributeData.find(
          (attr) => attr.name === "aria-label",
        );
        if (ariaLabelAttr) {
          elements.forEach((el) => {
            if (el.someText !== ariaLabelAttr.value) {
              el.someText = ariaLabelAttr.value; // Override someText with aria-label
            }
          });
        }
      }
    });

    const repeatedWords = Array.from(wordFrequency.entries())
      .filter(([_, count]) => count > 1)
      .map(([word]) => word);

    const result = [];
    const addedElements = new Set();

    // Helper function to check if an element has a specific attribute
    const hasAttribute = (element, attributeName) => {
      return element.attributeData?.some((attr) => attr.name === attributeName);
    };

    // Add one occurrence of each repeated word's element, prioritizing "aria-label" over "test-id"
    repeatedWords.forEach((word) => {
      if (wordToItems.has(word)) {
        let items = Array.from(wordToItems.get(word));

        // Prioritize elements: first by "aria-label", then by "test-id"
        items.sort(
          (a, b) =>
            hasAttribute(b, "aria-label") - hasAttribute(a, "aria-label") ||
            hasAttribute(b, "test-id") - hasAttribute(a, "test-id"),
        );

        if (!addedElements.has(items[0])) {
          result.push(items[0]);
          addedElements.add(items[0]);
        }
      }
    });

    // Add elements with unique words
    elementsList.forEach((element) => {
      if (!addedElements.has(element)) {
        const someText = element.someText?.trim();
        if (someText) {
          const words = someText.split(/[\s,;]+/).map((word) => word.trim());
          const isRepeated = words.some((word) => repeatedWords.includes(word));
          if (!isRepeated) {
            result.push(element);
            addedElements.add(element);
          }
        }
      }
    });

    // filter coordinate duplicates, keeping the first with aria-label or greatest attributeData size
    const uniqueCoords = new Map();
    const filteredResult = [];

    result.forEach((el) => {
      if (el.coordinates) {
        if (!uniqueCoords.has(el.coordinates)) {
          uniqueCoords.set(el.coordinates, el);
          filteredResult.push(el);
        } else {
          const existingEl = uniqueCoords.get(el.coordinates);
          if (
            !hasAttribute(existingEl, "aria-label") &&
            hasAttribute(el, "aria-label")
          ) {
            uniqueCoords.set(el.coordinates, el);
            filteredResult[filteredResult.indexOf(existingEl)] = el;
          } else if (el.attributeData && existingEl.attributeData) {
            if (el.attributeData.length > existingEl.attributeData.length) {
              uniqueCoords.set(el.coordinates, el);
              filteredResult[filteredResult.indexOf(existingEl)] = el;
            }
          }
        }
      } else {
        filteredResult.push(el);
      }
    });

    // Use a Set to keep track of unique XPath values
    const uniqueXPaths = new Set();
    const finalResult = [];

    filteredResult.forEach((el) => {
      if (el.xPath && !uniqueXPaths.has(el.xPath)) {
        uniqueXPaths.add(el.xPath);
        finalResult.push(el);
      }
    });

    // Add the elements that did not match the initial filter
    elementsList.forEach((element) => {
      if (
        element.tagName.toLowerCase() !== "span" &&
        element.tagName.toLowerCase() !== "div" &&
        element.tagName.toLowerCase() !== "button"
      ) {
        if (element.xPath && !uniqueXPaths.has(element.xPath)) {
          finalResult.push(element);
        }
      }
    });

    return finalResult;
  };

  function limitMapSize(sortedList) {
    let currentId = 1;

    sortedList.forEach((item) => {
      window.allElementInfo.push({ ...item, id: currentId++ });
    });
  }

  // function limitMapSize(sortedList) {
  //   // Check the length of allElementInfo before adding new elements
  //   //console.log("limitMapSize");
  //   let currentId = 1;
  //   sortedList.forEach((item) => {
  //     if (window.allElementInfo.length < 150) {
  //       window.allElementInfo.push({ ...item, id: currentId++ });
  //     }
  //   });
  // }

  function findMatLabel(sortedList) {
    sortedList.forEach((item) => {
      if (item.attribId || item.attribName) {
        let searchText = item.someText;
        let searchId = item.attribId;
        let searchName = item.attribName;
        let foundLabelText = null;

        const selectors = [];
        if (searchId) {
          selectors.push(`label[for="${searchId}"] mat-label`);
          selectors.push(`mat-label[for="${searchId}"]`);
          selectors.push(`mat-checkbox[test-id="${searchName}"] .mdc-label`); // Keep this in case 'test-id' is relevant
          selectors.push(`label[for="${searchId}"]`); // Direct label using 'for' attribute
        }
        if (searchName) {
          selectors.push(`label[for="${searchName}"] mat-label`);
          selectors.push(`mat-label[for="${searchName}"]`);
          selectors.push(`mat-checkbox[test-id="${searchName}"] .mdc-label`); // Keep this in case 'test-id' is relevant
          selectors.push(`label[for="${searchId}"]`); // Direct label using 'for' attribute
        }

        selectors.forEach((selector) => {
          const labelElement = document.querySelector(selector);
          if (labelElement && foundLabelText === null) {
            foundLabelText = labelElement.textContent.trim();
            // console.log(`Found mat-label text for input with id/name '${searchId || searchName}':`,foundLabelText);

            // Add "someText" to attributeData
            item.attributeData.push({ name: "someText", value: searchText });

            // Replace the value of someText with the found label text
            item.someText = foundLabelText;
          }
        });

        if (foundLabelText === null) {
          // console.log(`No mat-label found for input with id/name '${searchId || searchName}'.`);
        }
      }
    });
  }

  function changeDivToLabelWithSomeText(sortedList) {
    sortedList.forEach((item) => {
      if (item.someText && item.tagName === "div") {
        item.tagName = "label";
      }
    });
  }

  // Event listener to handle incoming messages from iframes
  window.addEventListener("message", function (event) {
    if (event.origin !== window.trustedOriginURL) {
      return; // Ignore messages from untrusted origins
    }

    //console.log("Received message data:", event.data);

    if (event.data.type === "elementsData") {
      const elementData = event.data.data; // Process received element data
      //console.log("Element data from parent:", elementData);
    }
  });

  function checkEdgeTrackingPrevention() {
    if (navigator.userAgent.includes("Edg")) {
      // console.log("Edge Tracking Prevention may be blocking iframes. Go to Edge Settings → Privacy, Search, and Services → Set Tracking Prevention to 'Basic' and refresh the page.");
    }
  }

  checkEdgeTrackingPrevention();

  // MOVE EVENT LISTENERS OUTSIDE
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(() => init("Direct Execution"), 0);
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(() => init("DOMContentLoaded"), 0),
    );
    window.addEventListener("load", () => init("load"));
    document.attachEvent?.("onreadystatechange", function () {
      if (document.readyState === "complete")
        setTimeout(() => init("onreadystatechange"), 0);
    });
    window.attachEvent?.("onload", () => init("onload"));
  }

  // startCollectingElements(window.searchTerms);
  // init("Initiate");
  // window.initSearchTerms = null; // Invalidating the function

  function normalizeSpaces(s) {
    return (s ?? "").toString().trim().replace(/\s+/g, " ");
  }

  function truncateAndNormalize(s, maxLen) {
    const t = normalizeSpaces(s);
    if (!t) return "";
    return t.length > maxLen ? t.slice(0, maxLen) : t;
  }

  function getAttr(attributeData, name) {
    if (!Array.isArray(attributeData)) return "";
    const found = attributeData.find(
      (a) =>
        a &&
        typeof a.name === "string" &&
        a.name.toLowerCase() === name.toLowerCase(),
    );
    return found?.value ?? "";
  }

  // Similar intent as your Java "isValidString"
  function hasText(s) {
    return normalizeSpaces(s).length > 0;
  }

  function extractFileExtensionFromHref(href) {
    const v = normalizeSpaces(href);
    if (!v) return "";
    // very small: take last path segment, then extension
    try {
      const u = new URL(v, window.location.href);
      const path = u.pathname || "";
      const last = path.split("/").pop() || "";
      const m = last.match(/\.([a-z0-9]+)$/i);
      return m ? m[1] : "";
    } catch {
      const m = v.match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
      return m ? m[1] : "";
    }
  }

  /**
   * Minimal port of your Java defineNameTitles + setElementText behavior.
   * We DO NOT try to replicate clickability checks etc. (JS doesn't have WebElement.isEnabled reliably).
   * Instead we follow your existing JS inputs: tagName + someText + attributes.
   */
  function defineNameTitlesJs(identity) {
    // identity: { tagName, someText, attribId, attribName, attributeData }
    const tag = (identity.tagName || "").toLowerCase();
    const attrs = identity.attributeData || [];

    // Java reads these attributes:
    const labelAttr = getAttr(attrs, "label"); // rarely present on HTML, but keep it
    const forLabelAttr = getAttr(attrs, "for");
    const idAttr = getAttr(attrs, "id");
    const nameAttr = getAttr(attrs, "name");
    const ariaLabel = getAttr(attrs, "aria-label");
    const formControlName = getAttr(attrs, "formcontrolname");
    const testId = getAttr(attrs, "test-id");
    const dataTestId = getAttr(attrs, "data-test-id");
    const title = getAttr(attrs, "title");
    const valueAttr = getAttr(attrs, "value");
    const innerHTML = getAttr(attrs, "innerhtml"); // likely not present; kept for parity
    const href = getAttr(attrs, "href");

    const textLabel = normalizeSpaces(identity.someText); // your JS already extracts "best" visible text
    const valueHrefFile = extractFileExtensionFromHref(href);

    const isAnchor = tag === "a";
    const isOption = tag === "option";

    // ---- choose nameLabel + nameField (minimal mapping) ----
    // We mirror your Java decision tree but using what JS already has.
    let nameLabel = "";
    let nameField = "";

    if (hasText(labelAttr)) {
      nameLabel = labelAttr;
      nameField = labelAttr;
    } else if (hasText(forLabelAttr)) {
      nameLabel = forLabelAttr;
      nameField = forLabelAttr;
    } else if (isOption && hasText(valueAttr)) {
      nameLabel = valueAttr;
      nameField = valueAttr;
    } else if (hasText(formControlName)) {
      nameLabel = formControlName;
      nameField = formControlName;
    } else if (hasText(testId)) {
      nameLabel = testId;
      nameField = testId;
    } else if (hasText(nameAttr)) {
      nameLabel = nameAttr;
      nameField = nameAttr;
    } else if (hasText(ariaLabel)) {
      nameLabel = ariaLabel;
      nameField = ariaLabel;
    } else if (isAnchor && hasText(innerHTML) && !/[<>]/.test(innerHTML)) {
      nameLabel = innerHTML;
      nameField = innerHTML;
    } else if (hasText(idAttr)) {
      nameLabel = idAttr;
      nameField = idAttr;
    } else if (hasText(valueHrefFile)) {
      nameLabel = `${valueHrefFile} File`;
      nameField = `${valueHrefFile} File`;
    } else if (hasText(textLabel)) {
      // for p/button/span/div in Java you set (textLabel, tagNameDefined)
      // BUT then setElementText overrides definedName anyway.
      nameLabel = textLabel;
      nameField = tag; // closest equivalent to your Java for those cases
    } else if (hasText(dataTestId)) {
      nameLabel = dataTestId;
      nameField = dataTestId;
    } else if (hasText(title)) {
      nameLabel = title;
      nameField = title;
    } else {
      nameLabel = tag || "";
      nameField = "NO IDENTIFICATION";
    }

    nameLabel = normalizeSpaces(nameLabel);
    nameField = normalizeSpaces(nameField);

    // ---- replicate Java setElementText() priority for definedName ----
    let definedName = nameLabel;

    // Your Java priority:
    // if attribId/attribName/someText present:
    //    definedName = someText (truncate 30)
    //    else attribId else attribName else nameDefinedPriority
    const hasAnyPriority =
      hasText(identity.attribId) ||
      hasText(identity.attribName) ||
      hasText(identity.someText);

    if (hasAnyPriority) {
      if (hasText(identity.someText)) {
        definedName = truncateAndNormalize(identity.someText, 30);
      } else if (hasText(identity.attribId)) {
        definedName = normalizeSpaces(identity.attribId);
      } else if (hasText(identity.attribName)) {
        definedName = normalizeSpaces(identity.attribName);
      }
    }

    return {
      nameLabel,
      nameField,
      definedName,
    };
  }
})(
  arguments[0],
  arguments[1],
  arguments[2],
  arguments[3],
  arguments[4],
  arguments[5],
  arguments[6],
  arguments[7],
);
// })(
//   ["button", "textarea", "input", "label", "a", "select"],
//   false,
//   52645,
//   "UPDATE_LIST_ELEMENTS",
//   "perform-list-data",
//   "searchTerms",
//   184,
//   310,
// );
