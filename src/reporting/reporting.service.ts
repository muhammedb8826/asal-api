import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { SupplierCredit } from '../entities/supplier-credit.entity';
import { PaymentApplication } from '../entities/payment-application.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { GrnItem } from '../entities/grn-item.entity';
import { ApInvoiceItem } from '../entities/ap-invoice-item.entity';
import { PurchaseItems } from '../entities/purchase-item.entity';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(ApInvoice)
    private readonly invoiceRepo: Repository<ApInvoice>,
    @InjectRepository(SupplierPayment)
    private readonly paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(SupplierCredit)
    private readonly creditRepo: Repository<SupplierCredit>,
    @InjectRepository(PaymentApplication)
    private readonly paymentAppRepo: Repository<PaymentApplication>,
    @InjectRepository(CreditApplication)
    private readonly creditAppRepo: Repository<CreditApplication>,
    @InjectRepository(GrnItem)
    private readonly grnItemRepo: Repository<GrnItem>,
    @InjectRepository(ApInvoiceItem)
    private readonly invoiceItemRepo: Repository<ApInvoiceItem>,
    @InjectRepository(PurchaseItems)
    private readonly purchaseItemRepo: Repository<PurchaseItems>,
  ) {}

  async getAgingReport(): Promise<{
    buckets: Array<{
      range: string;
      count: number;
      totalOutstanding: number;
      invoices: ApInvoice[];
    }>;
  }> {
    const today = new Date();
    const invoices = await this.invoiceRepo.find({
      where: [{ status: 'POSTED' }, { status: 'PARTIALLY_PAID' }],
      relations: ['items'],
    });

    const buckets = [
      { range: '0-30', days: [0, 30], invoices: [] as ApInvoice[] },
      { range: '31-60', days: [31, 60], invoices: [] as ApInvoice[] },
      { range: '61-90', days: [61, 90], invoices: [] as ApInvoice[] },
      { range: '90+', days: [91, Infinity], invoices: [] as ApInvoice[] },
    ];

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue;
      const daysPastDue = Math.floor(
        (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (const bucket of buckets) {
        if (daysPastDue >= bucket.days[0] && daysPastDue <= bucket.days[1]) {
          bucket.invoices.push(invoice);
          break;
        }
      }
    }

    return {
      buckets: buckets.map((bucket) => ({
        range: bucket.range,
        count: bucket.invoices.length,
        totalOutstanding: bucket.invoices.reduce(
          (sum, inv) => sum + inv.outstandingAmount,
          0,
        ),
        invoices: bucket.invoices,
      })),
    };
  }

  async getSupplierStatement(supplierId: string): Promise<{
    supplierId: string;
    invoices: Array<{
      id: string;
      series: string;
      invoiceDate: Date | null;
      dueDate: Date | null;
      totalAmount: number;
      paidAmount: number;
      creditAmount: number;
      outstandingAmount: number;
      status: string;
    }>;
    payments: Array<{
      id: string;
      series: string;
      paymentDate: Date;
      amount: number;
      applications: Array<{ invoiceId: string; amount: number }>;
    }>;
    credits: Array<{
      id: string;
      series: string;
      creditDate: Date | null;
      totalAmount: number;
      appliedAmount: number;
      outstandingAmount: number;
      status: string;
    }>;
    summary: {
      totalInvoiced: number;
      totalPaid: number;
      totalCredited: number;
      totalOutstanding: number;
    };
  }> {
    const invoices = await this.invoiceRepo.find({
      where: { supplierId },
      relations: ['items'],
    });

    const payments = await this.paymentRepo.find({
      where: { supplierId },
      relations: ['applications'],
    });

    const credits = await this.creditRepo.find({
      where: { supplierId },
      relations: ['applications'],
    });

    // Calculate credit amounts per invoice
    const creditByInvoice = new Map<string, number>();
    for (const credit of credits) {
      for (const app of credit.applications) {
        const current = creditByInvoice.get(app.invoiceId) || 0;
        creditByInvoice.set(app.invoiceId, current + app.amount);
      }
    }

    const invoiceData = invoices.map((inv) => ({
      id: inv.id,
      series: inv.series,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      creditAmount: creditByInvoice.get(inv.id) || 0,
      outstandingAmount: inv.outstandingAmount,
      status: inv.status,
    }));

    const paymentData = payments.map((pay) => ({
      id: pay.id,
      series: pay.series,
      paymentDate: pay.paymentDate,
      amount: pay.amount,
      applications: pay.applications.map((app) => ({
        invoiceId: app.invoiceId,
        amount: app.amount,
      })),
    }));

    const creditData = credits.map((cred) => ({
      id: cred.id,
      series: cred.series,
      creditDate: cred.creditDate,
      totalAmount: cred.totalAmount,
      appliedAmount: cred.appliedAmount,
      outstandingAmount: cred.outstandingAmount,
      status: cred.status,
    }));

    const summary = {
      totalInvoiced: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalPaid: payments.reduce((sum, pay) => sum + pay.amount, 0),
      totalCredited: credits.reduce((sum, cred) => sum + cred.appliedAmount, 0),
      totalOutstanding: invoices.reduce(
        (sum, inv) => sum + inv.outstandingAmount,
        0,
      ),
    };

    return {
      supplierId,
      invoices: invoiceData,
      payments: paymentData,
      credits: creditData,
      summary,
    };
  }

  async getVarianceReport(purchaseId?: string): Promise<{
    variances: Array<{
      purchaseItemId: string;
      productId: string;
      orderedBaseQuantity: number;
      receivedBaseQuantity: number;
      invoicedBaseQuantity: number;
      quantityVariance: number;
      orderedUnitPrice: number;
      invoicedUnitPrice: number;
      priceVariance: number;
      priceVariancePercent: number;
    }>;
  }> {
    let purchaseItems = await this.purchaseItemRepo.find({
      relations: ['purchase'],
    });

    if (purchaseId) {
      purchaseItems = purchaseItems.filter(
        (pi) => pi.purchaseId === purchaseId,
      );
    }

    const variances: Array<{
      purchaseItemId: string;
      productId: string;
      orderedBaseQuantity: number;
      receivedBaseQuantity: number;
      invoicedBaseQuantity: number;
      quantityVariance: number;
      orderedUnitPrice: number;
      invoicedUnitPrice: number;
      priceVariance: number;
      priceVariancePercent: number;
    }> = [];

    for (const pi of purchaseItems) {
      // Get received quantity
      type RawResult = { total?: string | number } | undefined;
      const receivedResult: RawResult = await this.grnItemRepo
        .createQueryBuilder('gi')
        .select('SUM(gi.baseQuantityReceived)', 'total')
        .where('gi.purchaseItemId = :id', { id: pi.id })
        .getRawOne();

      const receivedTotal = receivedResult?.total;
      const receivedBaseQuantity = parseFloat(
        typeof receivedTotal === 'string'
          ? receivedTotal
          : String(receivedTotal || '0'),
      );

      // Get invoiced quantity
      const invoicedResult: RawResult = await this.invoiceItemRepo
        .createQueryBuilder('ai')
        .select('SUM(ai.baseQuantity)', 'total')
        .where('ai.purchaseItemId = :id', { id: pi.id })
        .getRawOne();

      const invoicedTotal = invoicedResult?.total;
      const invoicedBaseQuantity = parseFloat(
        typeof invoicedTotal === 'string'
          ? invoicedTotal
          : String(invoicedTotal || '0'),
      );

      // Get average invoiced unit price
      const priceResult: RawResult = await this.invoiceItemRepo
        .createQueryBuilder('ai')
        .select('AVG(ai.unitPrice)', 'total')
        .where('ai.purchaseItemId = :id', { id: pi.id })
        .getRawOne();

      const avgPriceTotal = priceResult?.total;
      const invoicedUnitPrice = parseFloat(
        typeof avgPriceTotal === 'string'
          ? avgPriceTotal
          : String(avgPriceTotal || '0'),
      );

      const quantityVariance = invoicedBaseQuantity - receivedBaseQuantity;
      const priceVariance = invoicedUnitPrice - pi.unitPrice;
      const priceVariancePercent =
        pi.unitPrice > 0 ? (priceVariance / pi.unitPrice) * 100 : 0;

      variances.push({
        purchaseItemId: pi.id,
        productId: pi.productId,
        orderedBaseQuantity: pi.baseQuantity,
        receivedBaseQuantity,
        invoicedBaseQuantity,
        quantityVariance,
        orderedUnitPrice: pi.unitPrice,
        invoicedUnitPrice,
        priceVariance,
        priceVariancePercent,
      });
    }

    return { variances };
  }
}
