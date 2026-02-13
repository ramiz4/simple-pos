import { OrderStatusEnum } from '@simple-pos/shared/types';

export class OrderStateMachine {
  private static readonly transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
    [OrderStatusEnum.OPEN]: [
      OrderStatusEnum.PREPARING,
      OrderStatusEnum.COMPLETED,
      OrderStatusEnum.CANCELLED,
    ],
    [OrderStatusEnum.PREPARING]: [OrderStatusEnum.READY, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.READY]: [
      OrderStatusEnum.SERVED,
      OrderStatusEnum.OUT_FOR_DELIVERY,
      OrderStatusEnum.COMPLETED,
      OrderStatusEnum.CANCELLED,
    ],
    [OrderStatusEnum.OUT_FOR_DELIVERY]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.SERVED]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.COMPLETED]: [OrderStatusEnum.PREPARING],
    [OrderStatusEnum.CANCELLED]: [],
  };

  /**
   * Check if a transition from current status to next status is valid
   */
  static canTransition(current: OrderStatusEnum, next: OrderStatusEnum): boolean {
    if (current === next) return true;
    const allowed = this.transitions[current] || [];
    return allowed.includes(next);
  }

  /**
   * Get the primary next status in the happy path
   */
  static getNextStatus(current: OrderStatusEnum): OrderStatusEnum | null {
    const nextStates = this.transitions[current];
    return nextStates && nextStates.length > 0 ? nextStates[0] : null;
  }

  /**
   * Check if the status is a final state (no more transitions possible)
   */
  static isFinalStatus(status: OrderStatusEnum): boolean {
    return status === OrderStatusEnum.COMPLETED || status === OrderStatusEnum.CANCELLED;
  }
}
