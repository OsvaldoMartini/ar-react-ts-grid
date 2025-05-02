// Disable SSL verification (for development only)
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function logCSPDirectives() {
  const csp = document.querySelector(
    "meta[http-equiv='Content-Security-Policy']"
  );
  if (csp) {
    console.log("Content Security Policy:", csp.content);
    const directives = csp.content.split(";").map((d) => d.trim());
    const connectSrcDirective = directives.find((d) =>
      d.startsWith("connect-src")
    );
    if (connectSrcDirective) {
      console.log("connect-src:", connectSrcDirective);
    } else {
      // Check if default-src might apply to connections
      const defaultSrcDirective = directives.find((d) =>
        d.startsWith("default-src")
      );
      if (defaultSrcDirective) {
        console.log(
          "connect-src not explicitly set. Falling back to default-src:",
          defaultSrcDirective
        );
      } else {
        console.log(
          "connect-src not explicitly set, and no default-src found."
        );
      }
    }
  } else {
    // Check for CSP in HTTP headers (this is more complex and often requires a server request)
    // For a client-side script, you might not have direct access to these headers easily.
    // One potential (but less clean) way could involve a dummy fetch request and inspecting the headers.
    // However, this can be complex and might trigger CORS issues.
    console.log(
      "Content Security Policy meta tag not found. CSP might be set via HTTP headers."
    );
  }
}

// Call this function early in your script's execution
logCSPDirectives();

// Define the API endpoint (your local server)
const apiUrl = "https://localhost:61757/api/data"; // Replace with your API endpoint

// Function to send a POST request with JSON data
async function sendData() {
  try {
    // Sample data to send in the body
    const message = {
      key: "Trading View", // Replace with the actual data you want to send
      timestamp: new Date().toISOString(),
    };

    // Make a POST request to the API
    const response = await fetch(apiUrl, {
      method: "POST", // POST request
      headers: {
        "Content-Type": "application/json", // Ensuring we send JSON
      },
      body: JSON.stringify(message), // Convert the message object to a JSON string
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Parse the JSON response
    const data = await response.json();

    // Handle the data (for example, log it to the console)
    console.log(data);
  } catch (error) {
    // Handle errors
    console.error("There was a problem with the fetch operation:", error);
  }
}

// Call the function every 5 seconds (5000 ms)
setInterval(sendData, 5000); // 5000 ms = 5 seconds
