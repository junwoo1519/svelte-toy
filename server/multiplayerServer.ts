import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import process from 'process';

interface Room {
	id: string;
	p1: WebSocket | null;
	p2: WebSocket | null;
	createdAt: number;
}

const rooms = new Map<string, Room>();
const clientRoomMap = new Map<WebSocket, { roomId: string; role: 'p1' | 'p2' }>();
let globalWss: WebSocketServer | null = null;

export function startMultiplayerServer(port = 4000): WebSocketServer | null {
	if (globalWss) {
		return globalWss;
	}

	try {
		const wss = new WebSocketServer({ port, host: '0.0.0.0' }, () => {
			console.log(`=======================================================`);
			console.log(`🕹️  CURSOR DEFENSE 98 - MULTIPLAYER RELAY SERVER ONLINE`);
			console.log(`📡 WebSocket Listening on ws://0.0.0.0:${port}`);
			console.log(`=======================================================`);
		});

		wss.on('error', (err: any) => {
			if (err.code === 'EADDRINUSE') {
				console.log(`[!] Multiplayer WebSocket server port ${port} is already active. Reusing server.`);
			} else {
				console.error(`[!] WebSocket Server error:`, err);
			}
		});

		function generateRoomId(): string {
			let id = '';
			do {
				id = Math.floor(1000 + Math.random() * 9000).toString();
			} while (rooms.has(id));
			return id;
		}

		function sendJson(ws: WebSocket, data: any) {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(data));
			}
		}

		wss.on('connection', (ws: WebSocket) => {
			console.log(`[+] Client connected from socket`);

			ws.on('message', (message: string) => {
				try {
					const packet = JSON.parse(message.toString());

					switch (packet.type) {
						case 'CREATE_ROOM': {
							const roomId = generateRoomId();
							const room: Room = {
								id: roomId,
								p1: ws,
								p2: null,
								createdAt: Date.now()
							};
							rooms.set(roomId, room);
							clientRoomMap.set(ws, { roomId, role: 'p1' });

							console.log(`[🏠 ROOM CREATED] Room #${roomId} by Host (P1)`);
							sendJson(ws, {
								type: 'ROOM_CREATED',
								roomId,
								role: 'p1'
							});
							break;
						}

						case 'JOIN_ROOM': {
							const targetRoomId = (packet.roomId || '').trim();
							const room = rooms.get(targetRoomId);

							if (!room) {
								sendJson(ws, {
									type: 'ERROR',
									message: `방 코드 #${targetRoomId}를 찾을 수 없습니다.`
								});
								return;
							}

							if (room.p2 && room.p2.readyState === WebSocket.OPEN) {
								sendJson(ws, {
									type: 'ERROR',
									message: `방 #${targetRoomId}는 이미 2인 정원이 가득 찼습니다.`
								});
								return;
							}

							room.p2 = ws;
							clientRoomMap.set(ws, { roomId: targetRoomId, role: 'p2' });

							console.log(`[🤝 ROOM JOINED] Guest (P2) joined Room #${targetRoomId}`);

							// Notify Guest (P2)
							sendJson(ws, {
								type: 'ROOM_JOINED',
								roomId: targetRoomId,
								role: 'p2'
							});

							// Notify Both to Start Online Co-op
							if (room.p1) {
								sendJson(room.p1, {
									type: 'START_ONLINE_GAME',
									roomId: targetRoomId,
									role: 'p1',
									partnerRole: 'p2'
								});
							}
							sendJson(ws, {
								type: 'START_ONLINE_GAME',
								roomId: targetRoomId,
								role: 'p2',
								partnerRole: 'p1'
							});
							break;
						}

						case 'P2_ACTION': {
							// Guest (P2) action sent to Host (P1)
							const clientInfo = clientRoomMap.get(ws);
							if (clientInfo) {
								const room = rooms.get(clientInfo.roomId);
								if (room && room.p1) {
									sendJson(room.p1, {
										type: 'P2_ACTION',
										action: packet.action
									});
								}
							}
							break;
						}

						case 'GAME_SYNC': {
							// Host (P1) game state snapshot broadcast to Guest (P2)
							const clientInfo = clientRoomMap.get(ws);
							if (clientInfo && clientInfo.role === 'p1') {
								const room = rooms.get(clientInfo.roomId);
								if (room && room.p2) {
									sendJson(room.p2, {
										type: 'GAME_SYNC',
										state: packet.state
									});
								}
							}
							break;
						}

						case 'PING': {
							sendJson(ws, { type: 'PONG', time: packet.time });
							break;
						}
					}
				} catch (err) {
					console.error(`[!] Error parsing WebSocket message:`, err);
				}
			});

			ws.on('close', () => {
				const clientInfo = clientRoomMap.get(ws);
				if (clientInfo) {
					const { roomId, role } = clientInfo;
					const room = rooms.get(roomId);

					console.log(`[-] Client (${role}) disconnected from Room #${roomId}`);

					if (room) {
						if (role === 'p1') {
							// Host left, notify guest and close room
							if (room.p2) {
								sendJson(room.p2, {
									type: 'PARTNER_DISCONNECTED',
									message: '방장(1P)의 연결이 끊어졌습니다.'
								});
							}
							rooms.delete(roomId);
						} else if (role === 'p2') {
							// Guest left, notify host
							room.p2 = null;
							if (room.p1) {
								sendJson(room.p1, {
									type: 'PARTNER_DISCONNECTED',
									message: '2P 파트너의 연결이 끊어졌습니다.'
								});
							}
						}
					}
					clientRoomMap.delete(ws);
				}
			});
		});

		globalWss = wss;
		return wss;
	} catch (err: any) {
		if (err.code !== 'EADDRINUSE') {
			console.error(`[!] Failed to initialize WebSocket server:`, err);
		}
		return null;
	}
}

// Auto-run only if executed as main CLI script
try {
	if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
		const PORT = parseInt(process.env.PORT || '4000', 10);
		startMultiplayerServer(PORT);
	}
} catch (e) {}
