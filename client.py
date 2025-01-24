import stomp

class StompClient:
    def __init__(self, host="localhost", port=61614):
        self.host = host
        self.port = port
        self.conn = stomp.Connection([(self.host, self.port)])

    def send_message(self, destination="/queue/test", message="Hello, STOMP!"):
        self.conn.connect(wait=True)
        self.conn.send(destination=destination, body=message)
        print(f"Sent message: {message}")
        self.conn.disconnect()

if __name__ == "__main__":
    client = StompClient()
    client.send_message()
