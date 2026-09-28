export interface NetworkAction {
	type: 'SUMMON' | 'MERGE' | 'SELL' | 'TOGGLE_WARP' | 'UPGRADE_GACHA';
	slotIndex?: number;
	fromSlot?: number;
	toSlot?: number;
}

export class MultiplayerManager {
	private ws: WebSocket | null = null;
	public roomId: string | null = null;
	public role: 'p1' | 'p2' | null = null;
	public isConnected = false;
	public isInRoom = false;
	public errorMessage: string | null = null;

	public onStartGame?: (role: 'p1' | 'p2', roomId: string) => void;
	public onStateSync?: (state: any) => void;
	public onP2Action?: (action: NetworkAction) => void;
	public onPartnerDisconnected?: (message: string) => void;
	public onStatusChange?: () => void;

	public connect(serverUrl?: string): Promise<boolean> {
		return new Promise((resolve) => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.isConnected = true;
				resolve(true);
				return;
			}

			if (this.ws) {
				try {
					this.ws.close();
				} catch (e) {}
				this.ws = null;
			}

			const defaultHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
			const url = serverUrl || `ws://${defaultHost}:4000`;

			try {
				const socket = new WebSocket(url);
				this.ws = socket;

				socket.onopen = () => {
					console.log(`[📡 Network] Connected to multiplayer server: ${url}`);
					this.isConnected = true;
					this.errorMessage = null;
					this.notify();
					resolve(true);
				};

				socket.onmessage = (event) => {
					try {
						const packet = JSON.parse(event.data);
						this.handlePacket(packet);
					} catch (e) {
						console.error('[!] Failed to parse network packet:', e);
					}
				};

				socket.onerror = (err) => {
					console.error('[!] WebSocket error:', err);
					this.errorMessage = '멀티플레이 서버(ws://' + defaultHost + ':4000)에 연결할 수 없습니다.';
					this.isConnected = false;
					this.notify();
					resolve(false);
				};

				socket.onclose = () => {
					console.log('[-] Disconnected from multiplayer server');
					this.isConnected = false;
					this.isInRoom = false;
					this.notify();
				};
			} catch (e) {
				this.errorMessage = '네트워크 연결 실패';
				this.isConnected = false;
				this.notify();
				resolve(false);
			}
		});
	}

	public createRoom() {
		this.errorMessage = null;
		this.notify();

		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			this.connect().then((ok) => {
				if (ok) {
					this.send({ type: 'CREATE_ROOM' });
				}
			});
			return;
		}
		this.send({ type: 'CREATE_ROOM' });
	}

	public joinRoom(roomId: string) {
		this.errorMessage = null;
		this.notify();

		const cleanCode = roomId.replace('#', '').trim();
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			this.connect().then((ok) => {
				if (ok) {
					this.send({ type: 'JOIN_ROOM', roomId: cleanCode });
				}
			});
			return;
		}
		this.send({ type: 'JOIN_ROOM', roomId: cleanCode });
	}

	public sendP2Action(action: NetworkAction) {
		this.send({
			type: 'P2_ACTION',
			action
		});
	}

	public sendGameSync(state: any) {
		if (this.role === 'p1') {
			this.send({
				type: 'GAME_SYNC',
				state
			});
		}
	}

	private send(data: any) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	private handlePacket(packet: any) {
		switch (packet.type) {
			case 'ROOM_CREATED':
				this.roomId = packet.roomId;
				this.role = 'p1';
				this.isInRoom = true;
				this.errorMessage = null;
				this.notify();
				break;

			case 'ROOM_JOINED':
				this.roomId = packet.roomId;
				this.role = 'p2';
				this.isInRoom = true;
				this.errorMessage = null;
				this.notify();
				break;

			case 'START_ONLINE_GAME':
				this.roomId = packet.roomId;
				this.role = packet.role;
				this.isInRoom = true;
				this.errorMessage = null;
				if (this.onStartGame) {
					this.onStartGame(packet.role, packet.roomId);
				}
				this.notify();
				break;

			case 'P2_ACTION':
				if (this.role === 'p1' && this.onP2Action) {
					this.onP2Action(packet.action);
				}
				break;

			case 'GAME_SYNC':
				if (this.role === 'p2' && this.onStateSync) {
					this.onStateSync(packet.state);
				}
				break;

			case 'PARTNER_DISCONNECTED':
				this.errorMessage = packet.message;
				if (this.onPartnerDisconnected) {
					this.onPartnerDisconnected(packet.message);
				}
				this.notify();
				break;

			case 'ERROR':
				this.errorMessage = packet.message;
				this.notify();
				break;
		}
	}

	private notify() {
		if (this.onStatusChange) {
			this.onStatusChange();
		}
	}

	public disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.roomId = null;
		this.role = null;
		this.isInRoom = false;
		this.isConnected = false;
		this.errorMessage = null;
		this.notify();
	}
}

export const multiplayer = new MultiplayerManager();
