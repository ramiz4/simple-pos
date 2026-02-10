import { Injectable } from '@nestjs/common';
import { promises as dns } from 'dns';

@Injectable()
export class DnsVerificationService {
  async resolveTxtRecords(hostname: string): Promise<string[]> {
    const records = await dns.resolveTxt(hostname);
    return records
      .flat()
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
