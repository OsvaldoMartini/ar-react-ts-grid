const coordinatesElement = document.createElement("div");
coordinatesElement.id = "coordinates";
coordinatesElement.style.position = "fixed"; // Fixed so it stays above all elements
coordinatesElement.style.padding = "10px";
coordinatesElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
coordinatesElement.style.color = "white";
coordinatesElement.style.borderRadius = "5px";
coordinatesElement.style.fontSize = "14px";
coordinatesElement.style.zIndex = Number.MAX_SAFE_INTEGER; // Set zIndex to the maximum allowed value
coordinatesElement.textContent = "X: 0, Y: 0";

// Append the coordinates div to the body
document.body.appendChild(coordinatesElement);

// Add event listener for mouse movement to update coordinates
document.addEventListener("mousemove", function (event) {
  const x = event.clientX; // X position
  const y = event.clientY; // Y position

  // Get the dimensions of the coordinatesElement
  const elementWidth = coordinatesElement.offsetWidth;
  const elementHeight = coordinatesElement.offsetHeight;

  // Update the coordinates display
  coordinatesElement.textContent = `X: ${x}, Y: ${y}`;

  // Update the position of coordinatesElement to follow the cursor
  // Position the element such that the cursor is at the center of the element
  coordinatesElement.style.left = `${x - elementWidth / 2}px`; // Center the element on the X axis
  coordinatesElement.style.top = `${y - elementHeight / 2}px`; // Center the element on the Y axis
});

// Add event listener for click event to intercept the click
document.addEventListener("click", function (event) {
  event.preventDefault(); // Prevent the default click action

  // Get the coordinates of the click
  const clickX = event.clientX;
  const clickY = event.clientY;

  // Alert the coordinates of the click
  alert(`You clicked at X: ${clickX}, Y: ${clickY}`);
});
