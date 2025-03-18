declare module 'peerpay-client' {
    export type PaymentToken = {
      customInstructions: {
        derivationPrefix: string;
        derivationSuffix: string;
      };
      transaction: number[]; // Ensure it's number[] for compatibility
      amount: number;
    };
  
    /**
     * Represents an incoming payment received via MessageBox.
     */
    export type IncomingPayment = {
      messageId: number;
      sender: string;
      token: PaymentToken;
    };
  
    export default class PeerPayClient {
      constructor(config: { messageBoxHost?: string; walletClient: any });
  
      sendPayment(payment: { recipient: string; amount: number }): Promise<any>;
      acceptPayment(payment: IncomingPayment): Promise<any>;
      rejectPayment(payment: IncomingPayment): Promise<void>;
      listIncomingPayments(): Promise<IncomingPayment[]>;
      listenForLivePayments(options: { onPayment: (payment: IncomingPayment) => void }): Promise<void>;
    }
  }
  