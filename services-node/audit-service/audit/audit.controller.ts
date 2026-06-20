// Controleur d'audit : endpoints REST
import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { AuditService } from './audit.service'

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // GET /audit?resource=&actor=&action=&from=&to=&page=&limit=
  @Get()
  findAll(
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
    })
  }

  // POST /audit/log — soumission directe d'un evenement d'audit
  @Post('log')
  createLog(@Body() body: { routingKey?: string; actor?: string; [key: string]: unknown }) {
    const key = body.routingKey || 'manual.event'
    return this.auditService.createLog(body, key, body.actor as string | undefined)
  }
}
