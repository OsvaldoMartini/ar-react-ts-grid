const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors"); // Import cors
const app = express();
const port = 61757;

// SSL certificate files (you need to provide valid paths to these files)
const privateKey = fs.readFileSync(
  "C:/ARWeb/ARWeb-Scanner/javaFX/private-key.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "C:/ARWeb/ARWeb-Scanner/javaFX/certificate.pem",
  "utf8"
);
const ca = fs.readFileSync("C:/ARWeb/ARWeb-Scanner/javaFX/ca.pem", "utf8");

// Enable CORS for all routes
app.use(cors()); // Allow all origins to access this API

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to set Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://localhost:61757;" // Modify as needed
  );
  next();
});

// Sample route: GET
app.get("/api/data", (req, res) => {
  console.log("GET Request received");
  res.json({ message: "This is a GET response from your API" });
});

// Sample route: POST
app.post("/api/data", (req, res) => {
  const data = req.body;

  // Log the received data to the console
  console.log("Received Data:", JSON.stringify(data, null, 2)); // Pretty print the received JSON

  res.status(201).json({
    message: "Data received successfully",
    receivedData: data,
  });
});

// Create HTTPS server with SSL certificates
const credentials = { key: privateKey, cert: certificate, ca: ca };

https.createServer(credentials, app).listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
