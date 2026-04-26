import { Router } from 'express';
import { prisma } from '@abc/db';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * GET /api/track/:connote
 * Public endpoint to track a shipment. No authentication required.
 * Strips PII and internal financial data.
 */
router.get('/:connote', async (req, res, next) => {
  try {
    const connote = req.params.connote;

    const shipment = await prisma.shipment.findUnique({
      where: { connoteNumber: connote },
      select: {
        id: true,
        connoteNumber: true,
        status: true,
        weightKg: true,
        volumeM3: true,
        estimatedDeliveryDate: true,
        actualDeliveryDate: true,
        originBranch: {
          select: { code: true, name: true, city: true, region: true },
        },
        destinationBranch: {
          select: { code: true, name: true, city: true, region: true },
        },
        events: {
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            timestamp: true,
            branch: {
              select: { name: true, city: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      return sendError(res, 404, 'Shipment not found');
    }

    sendSuccess(res, shipment);
  } catch (err) {
    next(err);
  }
});

export default router;
