(function (targetOriginURL, trustedOriginURL, searchTerms, hiddenFields) {
  var pageFullyLoaded = false;
  function init(eventName) {
    if (pageFullyLoaded) {
      console.log("Event Name", eventName);
      if (
        eventName === "DOMContentLoaded" ||
        eventName === "onreadystatechange" ||
        eventName === "load" ||
        eventName === "onload"
      ) {
        console.log("Page fully loaded. Collecting elements...");
        // startCollectingElements();
      }
    }
    {
      pageFullyLoaded = true;
    }
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(() => init("Direct Execution"), 0); // Ensures it runs after the event loop
  } else if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(() => init("DOMContentLoaded"), 0)
    );
    window.addEventListener("load", () => init("load"));
  } else if (document.attachEvent) {
    document.attachEvent("onreadystatechange", function () {
      if (document.readyState === "complete")
        setTimeout(() => init("onreadystatechange"), 0);
    });
    window.attachEvent("onload", () => init("onload"));
  }
  // })(arguments[0], arguments[1], arguments[2], arguments[3]);
})(
  "http://localhost:3000/",
  "http://localhost:3000/",
  ["allWithText", "div", "id", "name", "input"],
  false
);
