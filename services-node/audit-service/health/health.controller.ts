// Controleur de sante : endpoint /health pour Kubernetes
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // GET /health -> renvoie le statut du service
  @Get()
  check() {
    return { status: 'UP', service: 'audit-service' };
  }
}
