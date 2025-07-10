import Stripe from 'stripe';

// Stripe MCP Provider - Real revenue data integration
export interface StripeMCPProvider {
  name: 'stripe';
  authenticate: (apiKey: string) => Promise<boolean>;
  getRevenue: (params: RevenueParams) => Promise<RevenueData>;
  getCustomers: (params?: CustomerParams) => Promise<CustomerData[]>;
  createInvoice: (params: InvoiceParams) => Promise<InvoiceResult>;
  getPayments: (params: PaymentParams) => Promise<PaymentData[]>;
}

export interface RevenueParams {
  startDate: Date;
  endDate: Date;
  currency?: string;
}

export interface RevenueData {
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    amount: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    amount: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
}

export interface CustomerParams {
  limit?: number;
  created?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  lastPayment: Date;
  status: 'active' | 'inactive';
}

export interface InvoiceParams {
  customerId: string;
  amount: number;
  description: string;
  dueDate?: Date;
}

export interface InvoiceResult {
  id: string;
  url: string;
  status: string;
  amount: number;
}

export interface PaymentParams {
  startDate: Date;
  endDate: Date;
  status?: 'succeeded' | 'pending' | 'failed';
  limit?: number;
}

export interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  customerId: string;
  description: string;
}

class StripeProvider implements StripeMCPProvider {
  name = 'stripe' as const;
  private stripe: Stripe | null = null;

  async authenticate(apiKey: string): Promise<boolean> {
    try {
      this.stripe = new Stripe(apiKey);
      // Test the connection
      await this.stripe.accounts.retrieve();
      return true;
    } catch (error) {
      console.error('Stripe authentication failed:', error);
      return false;
    }
  }

  async getRevenue(params: RevenueParams): Promise<RevenueData> {
    if (!this.stripe) throw new Error('Stripe not authenticated');

    try {
      // Get payments in date range
      const payments = await this.stripe.paymentIntents.list({
        created: {
          gte: Math.floor(params.startDate.getTime() / 1000),
          lte: Math.floor(params.endDate.getTime() / 1000),
        },
        limit: 100,
        expand: ['data.customer'],
      });

      // Filter successful payments
      const successfulPayments = payments.data.filter(
        payment => payment.status === 'succeeded'
      );

      // Calculate total revenue
      const totalRevenue = successfulPayments.reduce(
        (sum, payment) => sum + payment.amount, 0
      ) / 100; // Convert from cents

      const transactionCount = successfulPayments.length;
      const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      // Calculate daily breakdown
      const dailyBreakdown = this.calculateDailyBreakdown(successfulPayments, params);

      // Get top customers
      const topCustomers = await this.getTopCustomers(successfulPayments);

      // Analyze payment methods
      const paymentMethods = this.analyzePaymentMethods(successfulPayments);

      return {
        totalRevenue,
        transactionCount,
        averageTransactionValue,
        topCustomers,
        dailyBreakdown,
        paymentMethods
      };
    } catch (error) {
      console.error('Error fetching Stripe revenue:', error);
      throw new Error(`Failed to fetch revenue data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomers(params: CustomerParams = {}): Promise<CustomerData[]> {
    if (!this.stripe) throw new Error('Stripe not authenticated');

    try {
      const customers = await this.stripe.customers.list({
        limit: params.limit || 50,
        created: params.created ? {
          gte: params.created.gte ? Math.floor(params.created.gte.getTime() / 1000) : undefined,
          lte: params.created.lte ? Math.floor(params.created.lte.getTime() / 1000) : undefined,
        } : undefined,
      });

      const customerData: CustomerData[] = [];

      for (const customer of customers.data) {
        // Get customer's payment intents to calculate total spent
        const payments = await this.stripe.paymentIntents.list({
          customer: customer.id,
          limit: 100,
        });

        const totalSpent = payments.data
          .filter(payment => payment.status === 'succeeded')
          .reduce((sum, payment) => sum + payment.amount, 0) / 100;

        const lastPayment = payments.data.length > 0 
          ? new Date(payments.data[0].created * 1000)
          : new Date(customer.created * 1000);

        customerData.push({
          id: customer.id,
          name: customer.name || customer.email || 'Unknown',
          email: customer.email || '',
          totalSpent,
          lastPayment,
          status: payments.data.length > 0 ? 'active' : 'inactive'
        });
      }

      return customerData.sort((a, b) => b.totalSpent - a.totalSpent);
    } catch (error) {
      console.error('Error fetching Stripe customers:', error);
      throw new Error(`Failed to fetch customer data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createInvoice(params: InvoiceParams): Promise<InvoiceResult> {
    if (!this.stripe) throw new Error('Stripe not authenticated');

    try {
      const invoice = await this.stripe.invoices.create({
        customer: params.customerId,
        collection_method: 'send_invoice',
        days_until_due: params.dueDate 
          ? Math.ceil((params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 30,
        description: params.description,
      });

      // Add invoice item
      await this.stripe.invoiceItems.create({
        customer: params.customerId,
        invoice: invoice.id,
        amount: params.amount * 100, // Convert to cents
        description: params.description,
      });

      // Finalize and send
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);

      return {
        id: finalizedInvoice.id,
        url: finalizedInvoice.hosted_invoice_url || '',
        status: finalizedInvoice.status || '',
        amount: params.amount
      };
    } catch (error) {
      console.error('Error creating Stripe invoice:', error);
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayments(params: PaymentParams): Promise<PaymentData[]> {
    if (!this.stripe) throw new Error('Stripe not authenticated');

    try {
      const payments = await this.stripe.paymentIntents.list({
        created: {
          gte: Math.floor(params.startDate.getTime() / 1000),
          lte: Math.floor(params.endDate.getTime() / 1000),
        },
        limit: params.limit || 50,
        expand: ['data.customer'],
      });

      return payments.data
        .filter(payment => !params.status || payment.status === params.status)
        .map(payment => ({
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency.toUpperCase(),
          status: payment.status,
          created: new Date(payment.created * 1000),
          customerId: payment.customer as string || '',
          description: payment.description || ''
        }));
    } catch (error) {
      console.error('Error fetching Stripe payments:', error);
      throw new Error(`Failed to fetch payment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateDailyBreakdown(payments: Stripe.PaymentIntent[], params: RevenueParams) {
    const dailyMap = new Map<string, { amount: number; transactions: number }>();
    
    payments.forEach(payment => {
      const date = new Date(payment.created * 1000).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { amount: 0, transactions: 0 };
      dailyMap.set(date, {
        amount: existing.amount + (payment.amount / 100),
        transactions: existing.transactions + 1
      });
    });

    const result = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      transactions: data.transactions
    }));

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getTopCustomers(payments: Stripe.PaymentIntent[]): Promise<RevenueData['topCustomers']> {
    const customerMap = new Map<string, { name: string; amount: number }>();

    payments.forEach(payment => {
      if (payment.customer) {
        const customerId = typeof payment.customer === 'string' 
          ? payment.customer 
          : payment.customer.id;
        
        const customerName = typeof payment.customer === 'object' 
          ? payment.customer.name || payment.customer.email || 'Unknown'
          : 'Unknown';

        const existing = customerMap.get(customerId) || { name: customerName, amount: 0 };
        customerMap.set(customerId, {
          name: existing.name,
          amount: existing.amount + (payment.amount / 100)
        });
      }
    });

    return Array.from(customerMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private analyzePaymentMethods(payments: Stripe.PaymentIntent[]): RevenueData['paymentMethods'] {
    const methodMap = new Map<string, number>();
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    payments.forEach(payment => {
      // This would need to be expanded based on actual payment method data
      const method = 'card'; // Simplified for now
      const existing = methodMap.get(method) || 0;
      methodMap.set(method, existing + payment.amount);
    });

    return Array.from(methodMap.entries()).map(([type, amount]) => ({
      type,
      amount: amount / 100,
      percentage: (amount / totalAmount) * 100
    }));
  }
}

// Export singleton instance
export const stripeProvider = new StripeProvider();