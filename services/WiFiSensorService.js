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

const MAX_RECONNECT_DELAY_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;

class WiFiSensorService {
  constructor() {
    this.ws = null;
    this.mode = null; // 'server' or 'client'
    this.isConnected = false;
    this.onDataReceived = null;
    this.onConnectionChange = null;
    this.serverPort = 8765;

    this._serverIp = null;
    this._shouldReconnect = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
  }

  // ===== CLIENT MODE (მონიტორისთვის) =====

  connectToServer(serverIp) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${serverIp}:${this.serverPort}`;
        console.log('Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);
        this.mode = 'client';
        this._serverIp = serverIp;

        const connectTimeout = setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close();
            reject(new Error('კავშირის timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('WebSocket connected');
          this.isConnected = true;
          this._shouldReconnect = true;
          this._reconnectAttempts = 0;
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
          // onclose will follow and handle reconnect
          reject(new Error('კავშირი ვერ დამყარდა'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.isConnected = false;
          if (this.onConnectionChange) {
            this.onConnectionChange(false, null);
          }
          if (this._shouldReconnect && this._serverIp) {
            this._scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this._reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    console.log(`WiFi reconnect in ${delay}ms (attempt ${this._reconnectAttempts + 1})`);
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._reconnectAttempts++;
      this.connectToServer(this._serverIp).catch(() => {
        if (this._shouldReconnect) {
          this._scheduleReconnect();
        }
      });
    }, delay);
  }

  // ===== SERVER MODE (ტელეფონისთვის) =====
  // შენიშვნა: React Native-ში WebSocket სერვერის გაშვება
  // მოითხოვს Native Module-ს.

  sendData(data) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    this._shouldReconnect = false;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.mode = null;
    this._serverIp = null;
    this._reconnectAttempts = 0;
  }

  setOnDataReceived(callback) {
    this.onDataReceived = callback;
  }

  setOnConnectionChange(callback) {
    this.onConnectionChange = callback;
  }

  getIsConnected() {
    return this.isConnected;
  }

  getMode() {
    return this.mode;
  }
}

export default new WiFiSensorService();
