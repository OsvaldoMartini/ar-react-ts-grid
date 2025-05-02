import websocket
import ssl
import time
import threading

def on_message(ws, message):
    # Handle incoming message from WebSocket server
    print(f"Received message: {message}")

def on_error(ws, error):
    # Handle WebSocket error
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    # Handle WebSocket close event
    print("WebSocket closed")

def on_open(ws):
    # Called when WebSocket is opened
    print("WebSocket connection opened")
    # Send a test message after connection is opened
    test_message = 'Test message from Python'
    print(f"Sending message: {test_message}")
    ws.send(test_message)
    
    # Start sending pings every 15 seconds
    start_ping(ws)

def start_ping(ws):
    # This function will send a ping message to the WebSocket server every 15 seconds
    def ping():
        if ws and ws.sock and ws.sock.connected:
            try:
                print("Sending ping...")
                ws.send('ping-python')  # Send a ping message (customize this message as needed)
            except Exception as e:
                print(f"Error sending ping: {e}")
        else:
            print("WebSocket is not connected, skipping ping.")
        
        # Schedule the next ping in 15 seconds
        threading.Timer(15, ping).start()  # Call the ping function again after 15 seconds
    
    # Start the first ping
    ping()

def main():
    broker_url = 'wss://localhost:61757/websocket?sessionId=python-session'  # WebSocket URL
    print(f"Connecting to WebSocket at {broker_url}...")
    
    # Define the path to your .pem CA certificate
    ca_cert_path = 'C:/ARWeb/ARWeb-Scanner/javaFX/allinweb.pem'  # Path to your CA certificate in PEM format

    # WebSocket connection setup with SSL verification
    ws = websocket.WebSocketApp(
        broker_url,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )

    # Run the WebSocket with certificate verification
    ws.run_forever(
        sslopt={
            "ca_certs": ca_cert_path,
            "cert_reqs": ssl.CERT_REQUIRED,  # Enforce certificate verification
            "ssl_version": ssl.PROTOCOL_TLSv1_2  # Optional: specify TLS version
        }
    )

if __name__ == '__main__':
    main()
