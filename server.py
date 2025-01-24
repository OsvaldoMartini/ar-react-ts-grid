import stomp

class MyListener(stomp.ConnectionListener):
    def on_message(self, headers, message):
        print(f"Received message: {message}")

conn = stomp.Connection([('localhost', 61613)]) 
conn.set_listener('', MyListener())
conn.start()
conn.connect('user', 'password', wait=True) 
conn.subscribe('/topic/test', ack='auto') 

try:
    while True:
        pass
except KeyboardInterrupt:
    conn.disconnect()