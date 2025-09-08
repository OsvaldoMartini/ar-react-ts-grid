import stomp
import time

class MyListener(stomp.ConnectionListener):
    def __init__(self, connection):
        self.connection = connection

    def on_error(self, frame):
        print(f"Received error: {frame.body}")

    def on_message(self, frame):
        print(f"Received message: {frame.body}")

def main():
    broker_url = 'wss://localhost:60288/websocket'  # WebSocket URL (ensure this is correct)
    destination = '/topic/messages'

    try:
        # WebSocket support using the correct URL and port
        print("Connecting to the broker...")
        conn = stomp.Connection([('localhost', 60288)])  # Note: WebSocket over this connection

        conn.set_listener('', MyListener(conn))

        # Connect to the broker using WebSocket
        conn.connect(wait=True)
        print(f"Connected to {broker_url}")

        # Subscribe to the destination topic
        print(f"Subscribing to topic {destination}...")
        conn.subscribe(destination=destination, id=1, ack='auto')

        # Send a test message
        test_message = 'Test message from Python'
        print(f"Sending message: {test_message}")
        conn.send(destination=destination, body=test_message)

        # Wait to receive messages (you can adjust this according to your needs)
        print("Waiting for messages... Press Ctrl+C to stop.")
        time.sleep(30)  # Adjust the sleep time or use a different approach to keep the connection alive

        # Disconnect after receiving messages
        print("Disconnecting from the broker...")
        conn.disconnect()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
