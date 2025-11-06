import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SupplierCredit } from '../entities/supplier-credit.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { ApInvoice } from '../entities/ap-invoice.entity';
import { CreateSupplierCreditDto } from './dto/create-credit.dto';

@Injectable()
export class SupplierCreditService {
  constructor(
    @InjectRepository(SupplierCredit)
    private readonly creditRepo: Repository<SupplierCredit>,
    @InjectRepository(CreditApplication)
    private readonly applicationRepo: Repository<CreditApplication>,
    @InjectRepository(ApInvoice)
    private readonly invoiceRepo: Repository<ApInvoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async generateSeries(): Promise<string> {
    const last = await this.creditRepo
      .createQueryBuilder('c')
      .where('c.series LIKE :p', { p: 'CREDIT-%' })
      .orderBy('c.createdAt', 'DESC')
      .getOne();
    let n = 1;
    if (last?.series) {
      const m = last.series.match(/^CREDIT-(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `CREDIT-${String(n).padStart(4, '0')}`;
  }

  private async updateInvoiceCreditStatus(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) return;

    // Sum all credit applications for this invoice
    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await this.applicationRepo
      .createQueryBuilder('ca')
      .select('SUM(ca.amount)', 'total')
      .where('ca.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    const total = result?.total;
    const creditAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    // Recalculate outstanding: totalAmount - paidAmount - creditAmount
    invoice.outstandingAmount = Math.max(
      0,
      invoice.totalAmount - invoice.paidAmount - creditAmount,
    );

    await this.invoiceRepo.save(invoice);
  }

  private async updateCreditStatus(creditId: string): Promise<void> {
    const credit = await this.creditRepo.findOne({
      where: { id: creditId },
    });
    if (!credit) return;

    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await this.applicationRepo
      .createQueryBuilder('ca')
      .select('SUM(ca.amount)', 'total')
      .where('ca.creditId = :creditId', { creditId })
      .getRawOne();

    const total = result?.total;
    const appliedAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    credit.appliedAmount = appliedAmount;
    credit.outstandingAmount = credit.totalAmount - appliedAmount;

    if (appliedAmount >= credit.totalAmount) {
      credit.status = 'FULLY_APPLIED';
    } else if (appliedAmount > 0) {
      credit.status = 'PARTIALLY_APPLIED';
    } else if (credit.status === 'DRAFT') {
      // Keep DRAFT
    } else {
      credit.status = 'POSTED';
    }

    await this.creditRepo.save(credit);
  }

  async create(dto: CreateSupplierCreditDto): Promise<SupplierCredit> {
    const series = dto.series ?? (await this.generateSeries());
    const totalApplicationAmount =
      dto.applications?.reduce((sum, app) => sum + app.amount, 0) || 0;

    if (totalApplicationAmount > dto.totalAmount) {
      throw new BadRequestException(
        `Total application amount (${totalApplicationAmount}) exceeds credit amount (${dto.totalAmount})`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const credit = manager.create(SupplierCredit, {
        series,
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId ?? null,
        creditDate: dto.creditDate ? new Date(dto.creditDate) : null,
        reference: dto.reference ?? null,
        reason: dto.reason ?? null,
        note: dto.note ?? null,
        totalAmount: dto.totalAmount,
        appliedAmount: 0,
        outstandingAmount: dto.totalAmount,
        status: dto.status ?? 'DRAFT',
      });
      const saved = await manager.save(SupplierCredit, credit);

      // Apply credits to invoices
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

          const maxCreditable = invoice.totalAmount - invoice.paidAmount;
          if (app.amount > maxCreditable) {
            throw new BadRequestException(
              `Credit amount (${app.amount}) exceeds invoice creditable amount (${maxCreditable})`,
            );
          }

          const application = manager.create(CreditApplication, {
            creditId: saved.id,
            invoiceId: app.invoiceId,
            amount: app.amount,
          });
          await manager.save(CreditApplication, application);
        }

        // Update invoice and credit statuses
        for (const app of dto.applications) {
          await this.updateInvoiceCreditStatusInTransaction(
            manager,
            app.invoiceId,
          );
        }
        await this.updateCreditStatusInTransaction(manager, saved.id);
      }

      const full = await manager.findOne(SupplierCredit, {
        where: { id: saved.id },
        relations: ['applications', 'applications.invoice'],
      });
      if (!full)
        throw new NotFoundException('Supplier credit not found after create');
      return full;
    });
  }

  private async updateInvoiceCreditStatusInTransaction(
    manager: EntityManager,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await manager.findOne(ApInvoice, {
      where: { id: invoiceId },
    });
    if (!invoice) return;

    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await manager
      .createQueryBuilder(CreditApplication, 'ca')
      .select('SUM(ca.amount)', 'total')
      .where('ca.invoiceId = :invoiceId', { invoiceId })
      .getRawOne();

    const total = result?.total;
    const creditAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    invoice.outstandingAmount = Math.max(
      0,
      invoice.totalAmount - invoice.paidAmount - creditAmount,
    );

    await manager.save(ApInvoice, invoice);
  }

  private async updateCreditStatusInTransaction(
    manager: EntityManager,
    creditId: string,
  ): Promise<void> {
    const credit = await manager.findOne(SupplierCredit, {
      where: { id: creditId },
    });
    if (!credit) return;

    type RawResult = { total?: string | number } | undefined;
    const result: RawResult = await manager
      .createQueryBuilder(CreditApplication, 'ca')
      .select('SUM(ca.amount)', 'total')
      .where('ca.creditId = :creditId', { creditId })
      .getRawOne();

    const total = result?.total;
    const appliedAmount = parseFloat(
      typeof total === 'string' ? total : String(total || '0'),
    );

    credit.appliedAmount = appliedAmount;
    credit.outstandingAmount = credit.totalAmount - appliedAmount;

    if (appliedAmount >= credit.totalAmount) {
      credit.status = 'FULLY_APPLIED';
    } else if (appliedAmount > 0) {
      credit.status = 'PARTIALLY_APPLIED';
    } else if (credit.status === 'DRAFT') {
      // Keep DRAFT
    } else {
      credit.status = 'POSTED';
    }

    await manager.save(SupplierCredit, credit);
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
    supplierId?: string,
  ): Promise<{ data: SupplierCredit[]; total: number }> {
    const qb = this.creditRepo.createQueryBuilder('c');
    if (q) {
      qb.where('LOWER(c.series) LIKE :q OR LOWER(c.reference) LIKE :q', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    if (supplierId) {
      qb.andWhere('c.supplierId = :supplierId', { supplierId });
    }
    qb.leftJoinAndSelect('c.applications', 'applications')
      .leftJoinAndSelect('applications.invoice', 'invoice')
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<SupplierCredit> {
    const row = await this.creditRepo.findOne({
      where: { id },
      relations: ['applications', 'applications.invoice'],
    });
    if (!row) throw new NotFoundException('Supplier credit not found');
    return row;
  }

  async remove(id: string): Promise<void> {
    const credit = await this.findOne(id);
    if (credit.status === 'POSTED' && credit.applications.length > 0) {
      throw new BadRequestException(
        'Cannot delete credit with applications. Remove applications first.',
      );
    }
    await this.applicationRepo
      .createQueryBuilder()
      .delete()
      .where('creditId = :id', { id })
      .execute();
    await this.creditRepo.remove(credit);
  }
}
