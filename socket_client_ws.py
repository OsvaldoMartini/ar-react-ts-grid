import websocket
import time
import threading

def on_message(ws, message):
    print(f"Received message: {message}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WebSocket closed")

def on_open(ws):
    print("WebSocket connection opened")
    test_message = 'Test message from Python'
    print(f"Sending message: {test_message}")
    ws.send(test_message)
    start_ping(ws)

def start_ping(ws):
    def ping():
        if ws and ws.sock and ws.sock.connected:
            try:
                print("Sending ping...")
                ws.send('ping-socket-python-ip-130')
            except Exception as e:
                print(f"Error sending ping: {e}")
        else:
            print("WebSocket is not connected, skipping ping.")
        
        threading.Timer(5, ping).start()
    
    ping()

def main():
    # broker_url = 'ws://192.168.1.130:60192/websocket?sessionId=python-session'  # Changed to ws://
    broker_url = 'ws://localhost:60288/websocket?sessionId=python-session'  # Changed to ws://
    print(f"Connecting to WebSocket at {broker_url}...")

    ws = websocket.WebSocketApp(
        broker_url,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )

    # No SSL options for plain ws://
    ws.run_forever()

if __name__ == '__main__':
    main()
