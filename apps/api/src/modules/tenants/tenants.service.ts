import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<Tenant> {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const existing = await this.tenantsRepository.findOne({
      where: [{ email: data.email }, { slug }],
    });

    if (existing) {
      throw new ConflictException('Empresa já cadastrada');
    }

    const tenant = this.tenantsRepository.create({
      ...data,
      slug,
    });

    return this.tenantsRepository.save(tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({ where: { slug } });
  }
}
