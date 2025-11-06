import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { PaymentApplication } from '../entities/payment-application.entity';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { CreateSupplierPaymentDto } from './dto/create-payment.dto';
// import { UpdateSupplierPaymentDto } from './dto/update-payment.dto';

@Injectable()
export class SupplierPaymentService {
  constructor(
    @InjectRepository(SupplierPayment)
    private readonly paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(PaymentApplication)
    private readonly applicationRepo: Repository<PaymentApplication>,
    @InjectRepository(ApInvoice)
    private readonly invoiceRepo: Repository<ApInvoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async generateSeries(): Promise<string> {
    const last = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.series LIKE :p', { p: 'PAY-%' })
      .orderBy('p.createdAt', 'DESC')
      .getOne();
    let n = 1;
    if (last?.series) {
      const m = last.series.match(/^PAY-(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `PAY-${String(n).padStart(4, '0')}`;
  }

  private async updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) return;

    // Sum all payment applications for this invoice
    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await this.applicationRepo
      .createQueryBuilder('pa')
      .select('SUM(pa.amount)', 'total')
      .where('pa.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    const total = result?.total;
    const paidAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    invoice.paidAmount = paidAmount;
    invoice.outstandingAmount = invoice.totalAmount - paidAmount;

    // Update status
    if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'PAID';
    } else if (paidAmount > 0) {
      invoice.status = 'PARTIALLY_PAID';
    } else if (invoice.status === 'DRAFT') {
      // Keep DRAFT if not posted yet
    } else {
      invoice.status = 'POSTED';
    }

    await this.invoiceRepo.save(invoice);
  }

  async create(dto: CreateSupplierPaymentDto): Promise<SupplierPayment> {
    const series = dto.series ?? (await this.generateSeries());
    const totalApplicationAmount =
      dto.applications?.reduce((sum, app) => sum + app.amount, 0) || 0;

    if (totalApplicationAmount > dto.amount) {
      throw new BadRequestException(
        `Total application amount (${totalApplicationAmount}) exceeds payment amount (${dto.amount})`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const payment = manager.create(SupplierPayment, {
        series,
        supplierId: dto.supplierId,
        paymentDate: new Date(dto.paymentDate),
        amount: dto.amount,
        paymentMethod: dto.paymentMethod ?? null,
        reference: dto.reference ?? null,
        note: dto.note ?? null,
        status: dto.status ?? 'POSTED',
      });
      const saved = await manager.save(SupplierPayment, payment);

      // Apply payments to invoices
      if (dto.applications && dto.applications.length > 0) {
        for (const app of dto.applications) {
          const invoice = await manager.findOne(ApInvoice, {
            where: { id: app.invoiceId },
          });
          if (!invoice) {
            throw new NotFoundException(`Invoice ${app.invoiceId} not found`);
          }

          if (invoice.supplierId !== dto.supplierId) {
            throw new BadRequestException(
              `Invoice ${app.invoiceId} does not belong to supplier ${dto.supplierId}`,
            );
          }

          if (app.amount > invoice.outstandingAmount) {
            throw new BadRequestException(
              `Application amount (${app.amount}) exceeds invoice outstanding amount (${invoice.outstandingAmount})`,
            );
          }

          const application = manager.create(PaymentApplication, {
            paymentId: saved.id,
            invoiceId: app.invoiceId,
            amount: app.amount,
          });
          await manager.save(PaymentApplication, application);
        }

        // Update invoice payment statuses
        for (const app of dto.applications) {
          await this.updateInvoicePaymentStatusInTransaction(
            manager,
            app.invoiceId,
          );
        }
      }

      const full = await manager.findOne(SupplierPayment, {
        where: { id: saved.id },
        relations: ['applications', 'applications.invoice'],
      });
      if (!full)
        throw new NotFoundException('Supplier payment not found after create');
      return full;
    });
  }

  private async updateInvoicePaymentStatusInTransaction(
    manager: EntityManager,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await manager.findOne(ApInvoice, {
      where: { id: invoiceId },
    });
    if (!invoice) return;

    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await manager
      .createQueryBuilder(PaymentApplication, 'pa')
      .select('SUM(pa.amount)', 'total')
      .where('pa.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    const total = result?.total;
    const paidAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    invoice.paidAmount = paidAmount;
    invoice.outstandingAmount = invoice.totalAmount - paidAmount;

    if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'PAID';
    } else if (paidAmount > 0) {
      invoice.status = 'PARTIALLY_PAID';
    } else if (invoice.status === 'DRAFT') {
      // Keep DRAFT
    } else {
      invoice.status = 'POSTED';
    }

    await manager.save(ApInvoice, invoice);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
    supplierId?: string,
  ): Promise<{ data: SupplierPayment[]; total: number }> {
    const qb = this.paymentRepo.createQueryBuilder('p');
    if (q) {
      qb.where('LOWER(p.series) LIKE :q OR LOWER(p.reference) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    if (supplierId) {
      qb.andWhere('p.supplierId = :supplierId', { supplierId });
    }
    qb.leftJoinAndSelect('p.applications', 'applications')
      .leftJoinAndSelect('applications.invoice', 'invoice')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<SupplierPayment> {
    const row = await this.paymentRepo.findOne({
      where: { id },
      relations: ['applications', 'applications.invoice'],
    });
    if (!row) throw new NotFoundException('Supplier payment not found');
    return row;
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    if (payment.status === 'POSTED' && payment.applications.length > 0) {
      throw new BadRequestException(
        'Cannot delete payment with applications. Remove applications first.',
      );
    }
    await this.applicationRepo
      .createQueryBuilder()
      .delete()
      .where('paymentId = :id', { id })
      .execute();
    await this.paymentRepo.remove(payment);
  }
}
