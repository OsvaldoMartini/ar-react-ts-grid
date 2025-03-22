// (SENDER: scannerTool) -> scannerGrid
(function (
  searchTerms,
  hiddenFields,
  socketPort,
  sessionId,
  destination,
  operationId,
  homeBankingId
) {
  let attempts = 0;
  let maxAttempts = 100;
  let wSocket = null;
  let pageFullyLoaded = false;
  window.elementInfoMap = new Map();
  // window.searchTerms = ["button", "input", "a", "select"];
  window.searchTerms = searchTerms;
  window.allElementInfo = [];
  window.sessionId = sessionId;
  window.destination = destination;
  window.operationId = operationId;
  window.homeBankingId = homeBankingId;
  // var elementInfoSubmit = new Map();

  function connectWebSocket() {
    if (attempts >= maxAttempts) {
      console.error("Reached maximum reconnection attempts. Stopping.");
      return;
    }

    try {
      console.log(`Attempt ${attempts + 1} to connect to WebSocket...`);
      wSocket = new WebSocket(
        `ws://localhost:${socketPort}/websocket?sessionId=${window.sessionId}`
      );

      wSocket.onopen = () => {
        console.log(`WebSocket connected for session: ${window.sessionId}`);
        attempts = 0; // Reset attempts on successful connection

        try {
          const subscriptionMessage = {
            type: "echo",
            sessionId: window.sessionId,
            operationId: "test echo",
            body: "subscribe",
          };
          wSocket.send(JSON.stringify(subscriptionMessage));
        } catch (sendError) {
          console.error("Failed to send subscription message:", sendError);
        }

        // Call startCollectingElements AFTER WebSocket is open
        startCollectingElements(window.searchTerms);
      };

      wSocket.onmessage = (event) => {
        let receivedMessage = event.data;

        if (receivedMessage.endsWith("\u0000")) {
          receivedMessage = receivedMessage.slice(0, -1);
        }

        if (receivedMessage) {
          try {
            const parsedObject = JSON.parse(receivedMessage);
            console.log("WebSocket message received:", parsedObject);

            // Process parsedObject.body and parsedObject.footer here
            if (parsedObject.body.includes("data_updated")) {
              //Handle data update
            }

            if (
              parsedObject.body.includes("cannot be processed") ||
              (parsedObject.footer &&
                parsedObject.footer.includes("cannot be processed"))
            ) {
              //Handle cannot be processed
            }
          } catch (parseError) {
            console.warn("Non-JSON message received:", receivedMessage);
          }
        }
      };

      wSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // connectWebSocket(); // Retry connection
      };

      wSocket.onclose = () => {
        console.log("WebSocket connection closed");

        if (attempts < maxAttempts) {
          attempts++;
          console.log(`Reconnecting attempt ${attempts}...`);
          connectWebSocket(); // Retry connection
        } else {
          console.log(
            `${maxAttempts} Attempts to Reconnect with the WebSocket.`
          );
        }
      };
    } catch (initError) {
      console.error("Failed to initialize WebSocket:", initError);
    }
  }

  // Optionally, expose a cleanup function
  window.cleanupWebSocket = () => {
    try {
      console.log("Cleaning up WebSocket...");
      if (wSocket && wSocket.readyState === WebSocket.OPEN) {
        wSocket.close();
      }
    } catch (cleanupError) {
      console.error("Error during WebSocket cleanup:", cleanupError);
    }
  };

  function init(eventName) {
    if (pageFullyLoaded) {
      console.log("Event Name", eventName);
      if (
        [
          "DOMContentLoaded",
          "onreadystatechange",
          "load",
          "onload",
          "Direct Execution",
        ].includes(eventName) ||
        ["complete", "interactive"].includes(document.readyState)
      ) {
        console.log("searchTerms", window.searchTerms);
        connectWebSocket();
        // startCollectingElements(window.searchTerms);
      }
    }
    pageFullyLoaded = true;
  }

  // Function to collect general elements based on search terms
  const collectElements = function collectElements(
    doc,
    searchTerms,
    collectionFound
  ) {
    // Collect elements from the current document using the provided search terms
    if (searchTerms.length > 0) {
      searchTerms.forEach((selector) => {
        // If search term includes "with id", filter only elements that have an "id" attribute
        if (selector.includes("with id")) {
          collectionFound.push(...Array.from(doc.querySelectorAll("[id]")));
        } // If search term includes "with id", filter only elements that have an "id" attribute
        else if (selector.includes("with name")) {
          foundElements = Array.from(doc.querySelectorAll("[name]"));
          collectionFound.push(...Array.from(doc.querySelectorAll("[name]")));
        } else {
          collectionFound.push(...Array.from(doc.querySelectorAll(selector)));
        }
      });
    } else {
      // Collect all elements except iframes
      collectionFound.push(
        ...Array.from(doc.querySelectorAll("*")).filter(
          (el) => el.tagName.toLowerCase() !== "iframe"
        )
      );
    }

    // After collecting, process element identities for the parent document
    collectionFound.forEach((element) => {
      if (
        ["html", "body", "main", "script", "meta", "head", "style"].includes(
          element.tagName.toLowerCase()
        )
      ) {
        return;
      }

      const elementIdentity = getElementIdentity(element);
      if (elementIdentity) {
        filterSearchTerms(
          "tagName-Found",
          elementIdentity.xPath,
          elementIdentity,
          searchTerms
        );
      }
    });
  };

  function filterSearchTerms(
    typeDTO,
    referXPath,
    elementIdentity,
    searchTerms
  ) {
    if (
      searchTerms.length === 0 ||
      (!searchTerms.includes("with id") &&
        !searchTerms.includes("with name") &&
        !searchTerms.includes("with text"))
    ) {
      // If no search terms, directly add the element
      window.elementInfoMap.set(
        referXPath,
        elementDTO(typeDTO, elementIdentity)
      );
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
        window.elementInfoMap.set(
          referXPath,
          elementDTO(typeDTO, elementIdentity)
        );
      }
    });
  }

  function fetchAndParseIframeContent(iframe) {
    if (!iframe.src) return null;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", iframe.src, false); // 'false' makes the request synchronous

    try {
      xhr.send();

      if (xhr.status !== 200) {
        console.error("Error fetching the iframe content:", xhr.status);
        return null;
      }

      const htmlContent = xhr.responseText;

      // Parse the HTML content
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(htmlContent, "text/html");

      // Get all elements inside the parsed document
      const srcElements = parsedDocument.querySelectorAll("*");
      console.log(`srcElements Total: <${srcElements.length}>`);

      // srcElements.forEach((element) => {
      //   console.log(`Element: <${element.tagName}>`);
      //   console.log("Text Content:", element.textContent.trim());
      // });

      return srcElements; // Return the NodeList
    } catch (error) {
      console.error("Error fetching the iframe content:", error);
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
      }; ${iframeDetails}`
    );
    // // Store the iframe details in the elementInfoMap
    // elementInfoMap.set(
    //   xPathIFrame,
    //   `xpath:${xPathIFrame};text:${
    //     iframe.src ||
    //     iframe.title ||
    //     iframe.id ||
    //     iframe.name ||
    //     "No description"
    //   };${iframeDetails}`
    // );
  };

  // Function to collect iframe elements recursively
  const collectIframeElements = function collectIframeElements(
    doc,
    collectionFound,
    isIframeChild = false
  ) {
    doc.querySelectorAll("iframe").forEach((iframe) => {
      try {
        let iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;

        try {
          console.log(
            "Iframe origin:",
            new URL(iframe.src, window.location.origin).origin
          );
          console.log("Parent origin:", window.location.origin);
        } catch (e) {
          console.warn("Cross-origin access denied for iframe:", iframe.src);
        }

        if (iframe) {
          let iframeParsed = null;
          let srcDocElements = null;

          const xPathIFrame = getMartiniXPath(iframe); // Get the XPath of the iframe

          const elementIdentity = getElementIdentity(iframe);
          if (elementIdentity) {
            filterSearchTerms(
              "iFrame-Found",
              elementIdentity.xPath,
              elementIdentity,
              searchTerms
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
                    "iFrame-Child",
                    `${xPathIFrame}${elementIdentity?.xPath}`,
                    elementIdentity,
                    searchTerms
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
                : 0
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
                  "iFrame-Child",
                  `${xPathIFrame}${elementIdentity?.xPath}`,
                  elementIdentity,
                  searchTerms
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
                "iFrame-Child",
                `${xPathIFrame}${elementIdentity?.xPath}`,
                elementIdentity,
                searchTerms
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
          console.warn(`Skipping cross-origin iframe: ${iframe.src}`);
        }
      } catch (e) {
        console.error(
          `Error accessing iframe: ${iframe.src || "Unknown iframe"}`,
          e
        );
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
            "iFrame-Child",
            `${xPathIFrame}${elementIdentity?.xPath}`,
            elementIdentity,
            searchTerms
          );
        }
      });
  };

  // Function to initialize the collection process
  const startCollectingElements = function startCollectingElements(
    searchTerms
  ) {
    // const searchTerms = ["button", "input", "a", "div"]; // Define elements to search for
    window.elementInfoMap = new Map(); // Initialize the map to store element information
    let collectionFound = [];

    // First, collect iframe elements
    collectIframeElements(document, collectionFound, elementInfoMap);

    // Then, collect general elements based on search terms
    collectElements(document, searchTerms, collectionFound, elementInfoMap);

    window.allElementInfo = [];
    limitMapCharacters(window.elementInfoMap);
    console.log("All element info stored in Map:", window.allElementInfo);
    window.elementInfoMap.clear();

    if (wSocket && wSocket.readyState) {
      console.log("WebSocket readyState:", wSocket.readyState);
    }

    if (wSocket && wSocket.readyState === WebSocket.OPEN) {
      const message = {
        type: "SEARCH_TOOL",
        sessionId: window.destination,
        operationId: window.operationId,
        homeBankingId: window.homeBankingId,
        details: window.allElementInfo, // Send allElementInfo
      };
      wSocket.send(JSON.stringify(message));
      console.log("Sent SEARCH_TOOL:", message);
    }
  };

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
    const xPath = getMartiniXPath(element);
    const tagName = element.tagName.toLowerCase();
    const attributeData = Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));
    const attribId = element.id || "";
    const attribName = element.name || "";
    const coordinates = `${element
      .getBoundingClientRect()
      .left.toFixed(2)},${element.getBoundingClientRect().top.toFixed(2)}`;
    const someText = getVisibleText(tagName, attributeData, element);

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

  const elementDTO = function elementDTO(typeElement, identity) {
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
      attributeValue: identity.attributeValue ?? "",
      attributeType: identity.attributeType ?? "",
      searchAttributeValue: identity.searchAttributeValue ?? "",
    };
  };

  function limitMapCharacters(elementInfoMap) {
    elementInfoMap.forEach((value, key) => {
      let modifiedValue = value;
      window.allElementInfo.push(modifiedValue);
    });
  }

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
              foundAttr.value
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
              (word) => !isTechnicalPattern(word)
            );
            const filteredText = filteredWords.join(" ").trim();
            if (filteredText) result.text.add(filteredText);
          } else if (placeholder) {
            const words = placeholder.split(/\s+/);
            const filteredWords = words.filter(
              (word) => !isTechnicalPattern(word)
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
            (word) => !isTechnicalPattern(word)
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
        console.warn("Could not access iframe content", e);
      }
    });

    // Return arrays instead of Sets
    return {
      text: Array.from(result.text),
      labels: Array.from(result.labels),
      titles: Array.from(result.titles),
    };
  }
  // Event listener to handle incoming messages from iframes
  window.addEventListener("message", function (event) {
    if (event.origin !== window.trustedOriginURL) {
      return; // Ignore messages from untrusted origins
    }

    console.log("Received message data:", event.data);

    if (event.data.type === "elementsData") {
      const elementData = event.data.data; // Process received element data
      console.log("Element data from parent:", elementData);
    }
  });

  function checkEdgeTrackingPrevention() {
    if (navigator.userAgent.includes("Edg")) {
      console.log(
        "Edge Tracking Prevention may be blocking iframes. Go to Edge Settings → Privacy, Search, and Services → Set Tracking Prevention to 'Basic' and refresh the page."
      );
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
      setTimeout(() => init("DOMContentLoaded"), 0)
    );
    window.addEventListener("load", () => init("load"));
    document.attachEvent?.("onreadystatechange", function () {
      if (document.readyState === "complete")
        setTimeout(() => init("onreadystatechange"), 0);
    });
    window.attachEvent?.("onload", () => init("onload"));
  }

  connectWebSocket();
  // startCollectingElements(window.searchTerms);
  // init("Initiate");
  // window.initSearchTerms = null; // Invalidating the function
  // })(
  //   arguments[0],
  //   arguments[1],
  //   arguments[2],
  //   arguments[3],
  //   arguments[4],
  //   arguments[5],
  //   arguments[6]
  // );

  // })([], false, 8181, "scannerTool", "scannerGrid", "searchTerms", 3);
  // })(["with name"], false, 8181, "scannerTool", "scannerGrid", "searchTerms", 3);
})(
  ["input", "button", "a", "select"],
  false,
  8181,
  "scannerTool",
  "scannerGrid-3",
  "searchTerms",
  3
);
// })(["*"], false, 8181, "scannerTool", "scannerGrid", "searchTerms", 3);
// })(["button"], false, 8181, "scannerTool", "scannerGrid", "searchTerms", 3);
