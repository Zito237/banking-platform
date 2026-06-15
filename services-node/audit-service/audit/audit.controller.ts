// Controleur d'audit : endpoints REST pour consulter les logs
import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // ============================================================
  // GET /audit?resource=&actor=&action=&from=&to=&page=&limit=
  // Liste paginee des journaux d'audit (reserve a l'admin)
  // ============================================================
  @Get()
  async findAll(
    @Query('resource') resource?: string,
    @Query('actor') actor?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findLogs({
      resource,
      actor,
      action,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
