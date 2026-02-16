/**
 * WiFi Sensor Streaming Service
 *
 * მონაცემების გადაცემა ლოკალურ ქსელში WebSocket-ით
 * უფრო საიმედოა ვიდრე BLE და მუშაობს ყველა Android მოწყობილობაზე
 *
 * რეჟიმები:
 * 1. SERVER - ტელეფონი (სენსორის მქონე) აგზავნის მონაცემებს
 * 2. CLIENT - მონიტორი იღებს მონაცემებს
 */

class WiFiSensorService {
  constructor() {
    this.ws = null;
    this.server = null;
    this.mode = null; // 'server' or 'client'
    this.isConnected = false;
    this.onDataReceived = null;
    this.onConnectionChange = null;
    this.serverPort = 8765;
    this.reconnectInterval = null;
  }

  // ===== CLIENT MODE (მონიტორისთვის) =====

  // სერვერთან დაკავშირება IP მისამართით
  connectToServer(serverIp) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${serverIp}:${this.serverPort}`;
        console.log('Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);
        this.mode = 'client';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          if (this.onConnectionChange) {
            this.onConnectionChange(true, serverIp);
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (this.onDataReceived) {
              this.onDataReceived(data);
            }
          } catch (e) {
            console.log('Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.log('WebSocket error:', error);
          reject(new Error('კავშირი ვერ დამყარდა'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.isConnected = false;
          if (this.onConnectionChange) {
            this.onConnectionChange(false, null);
          }
        };

        // Timeout
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close();
            reject(new Error('კავშირის timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // ===== SERVER MODE (ტელეფონისთვის) =====
  // შენიშვნა: React Native-ში WebSocket სერვერის გაშვება
  // მოითხოვს Native Module-ს.
  // ამჯამად გამოვიყენოთ მარტივი polling მეთოდი.

  // მონაცემების გაგზავნა (თუ დაკავშირებულია)
  sendData(data) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // კავშირის გაწყვეტა
  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.mode = null;
  }

  // Callbacks
  setOnDataReceived(callback) {
    this.onDataReceived = callback;
  }

  setOnConnectionChange(callback) {
    this.onConnectionChange = callback;
  }

  // სტატუსი
  getIsConnected() {
    return this.isConnected;
  }

  getMode() {
    return this.mode;
  }
}

export default new WiFiSensorService();
