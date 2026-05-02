import { Injectable, Logger } from '@nestjs/common';

type SpinEmailPayload = {
  email?: string;
  participationId: number;
  result: 'WIN' | 'LOSE';
  prizeName?: string;
};

type FulfillmentConfirmationEmailPayload = {
  email?: string;
  name: string;
  participationId: number;
  prizeName?: string | null;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendSpinResultEmail(payload: SpinEmailPayload): Promise<void> {
    // This runs as a non-blocking side effect; replace this logger integration
    // with your real SMTP/provider adapter without changing spin flow.
    this.logger.log(
      `Spin result email queued: participationId=${payload.participationId}, result=${payload.result}, recipient=${payload.email ?? 'unknown'}, prize=${payload.prizeName ?? 'N/A'}`,
    );
  }

  async sendFulfillmentConfirmationEmail(
    payload: FulfillmentConfirmationEmailPayload,
  ): Promise<void> {
    this.logger.log(
      `Fulfillment confirmation email queued: participationId=${payload.participationId}, recipient=${payload.email ?? 'unknown'}, name=${payload.name}, prize=${payload.prizeName ?? 'N/A'}`,
    );
  }
}
