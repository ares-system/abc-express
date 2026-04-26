// ============================================
// ABC Express AIP — WebSocket Layer (Socket.IO)
// Real-time event broadcasting for dashboards,
// tracking, and AI decision notifications
// ============================================

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from './utils/logger.js';

let io: Server | null = null;

// ─── Room names ─────────────────────────────────────────────
export const ROOMS = {
  DASHBOARD_OPS: 'dashboard:ops',
  DASHBOARD_FINANCE: 'dashboard:finance',
  DASHBOARD_AI: 'dashboard:ai',
  TRACKING: (connote: string) => `tracking:${connote}`,
  SHIPMENT: (id: string) => `shipment:${id}`,
  BRANCH: (id: string) => `branch:${id}`,
  DECISIONS: 'decisions',
} as const;

// ─── Event types ────────────────────────────────────────────
export const WS_EVENTS = {
  // Server → Client
  SHIPMENT_CREATED: 'shipment:created',
  SHIPMENT_UPDATED: 'shipment:updated',
  SHIPMENT_STATUS_CHANGED: 'shipment:status_changed',
  TRACKING_UPDATE: 'tracking:update',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_STATUS_CHANGED: 'invoice:status_changed',
  DECISION_NEW: 'decision:new',
  DECISION_RESOLVED: 'decision:resolved',
  VEHICLE_STATUS_CHANGED: 'vehicle:status_changed',
  KPI_REFRESH: 'kpi:refresh',

  // Client → Server
  JOIN_ROOM: 'join',
  LEAVE_ROOM: 'leave',
  SUBSCRIBE_TRACKING: 'subscribe:tracking',
  UNSUBSCRIBE_TRACKING: 'unsubscribe:tracking',
} as const;

// ─── Initialize Socket.IO ───────────────────────────────────
export const initWebSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket connected: ${socket.id}`);

    // ── Room management ──
    socket.on(WS_EVENTS.JOIN_ROOM, (room: string) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on(WS_EVENTS.LEAVE_ROOM, (room: string) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room: ${room}`);
    });

    // ── Tracking subscriptions ──
    socket.on(WS_EVENTS.SUBSCRIBE_TRACKING, (connoteNumber: string) => {
      const room = ROOMS.TRACKING(connoteNumber);
      socket.join(room);
      logger.debug(`Socket ${socket.id} subscribed to tracking: ${connoteNumber}`);
    });

    socket.on(WS_EVENTS.UNSUBSCRIBE_TRACKING, (connoteNumber: string) => {
      const room = ROOMS.TRACKING(connoteNumber);
      socket.leave(room);
    });

    // ── Disconnect ──
    socket.on('disconnect', (reason: string) => {
      logger.info(`WebSocket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err: Error) => {
      logger.error(`WebSocket error on ${socket.id}: ${err.message}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

// ─── Broadcast helpers ──────────────────────────────────────
// These are called from route handlers to push real-time updates

export const getIO = (): Server => {
  if (!io) throw new Error('WebSocket server not initialized');
  return io;
};

export const broadcast = {
  /** Notify ops dashboard of a new shipment */
  shipmentCreated(shipment: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DASHBOARD_OPS).emit(WS_EVENTS.SHIPMENT_CREATED, shipment);
    if (shipment.originBranchId) {
      io.to(ROOMS.BRANCH(shipment.originBranchId as string)).emit(WS_EVENTS.SHIPMENT_CREATED, shipment);
    }
  },

  /** Notify tracking subscribers and dashboard of status change */
  shipmentStatusChanged(shipment: Record<string, unknown>, event: Record<string, unknown>) {
    if (!io) return;
    const connote = shipment.connoteNumber as string;
    const shipmentId = shipment.id as string;

    io.to(ROOMS.TRACKING(connote)).emit(WS_EVENTS.TRACKING_UPDATE, { shipment, event });
    io.to(ROOMS.SHIPMENT(shipmentId)).emit(WS_EVENTS.SHIPMENT_STATUS_CHANGED, { shipment, event });
    io.to(ROOMS.DASHBOARD_OPS).emit(WS_EVENTS.SHIPMENT_STATUS_CHANGED, { shipment, event });
  },

  /** Push new AI decision to decision watchers */
  decisionCreated(decision: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DECISIONS).emit(WS_EVENTS.DECISION_NEW, decision);
    io.to(ROOMS.DASHBOARD_AI).emit(WS_EVENTS.DECISION_NEW, decision);
  },

  /** Notify when decision is approved/overridden/rejected */
  decisionResolved(decision: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DECISIONS).emit(WS_EVENTS.DECISION_RESOLVED, decision);
    io.to(ROOMS.DASHBOARD_AI).emit(WS_EVENTS.DECISION_RESOLVED, decision);
  },

  /** Invoice events to finance dashboard */
  invoiceCreated(invoice: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DASHBOARD_FINANCE).emit(WS_EVENTS.INVOICE_CREATED, invoice);
  },

  invoiceStatusChanged(invoice: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DASHBOARD_FINANCE).emit(WS_EVENTS.INVOICE_STATUS_CHANGED, invoice);
  },

  /** Vehicle status change */
  vehicleStatusChanged(vehicle: Record<string, unknown>) {
    if (!io) return;
    io.to(ROOMS.DASHBOARD_OPS).emit(WS_EVENTS.VEHICLE_STATUS_CHANGED, vehicle);
  },

  /** Trigger KPI refresh on all dashboards */
  refreshKPI(dashboard: 'ops' | 'finance' | 'ai') {
    if (!io) return;
    const room =
      dashboard === 'ops'
        ? ROOMS.DASHBOARD_OPS
        : dashboard === 'finance'
          ? ROOMS.DASHBOARD_FINANCE
          : ROOMS.DASHBOARD_AI;
    io.to(room).emit(WS_EVENTS.KPI_REFRESH, { dashboard, timestamp: new Date().toISOString() });
  },
};
