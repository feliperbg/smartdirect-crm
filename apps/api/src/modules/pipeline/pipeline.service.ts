import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline } from './entities/pipeline.entity';
import { Stage } from './entities/stage.entity';
import { Deal } from './entities/deal.entity';

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(Pipeline)
    private pipelineRepository: Repository<Pipeline>,
    @InjectRepository(Stage)
    private stageRepository: Repository<Stage>,
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
  ) {}

  async createPipeline(
    tenantId: string,
    data: Partial<Pipeline>,
  ): Promise<Pipeline> {
    const pipeline = this.pipelineRepository.create({ ...data, tenantId });
    return this.pipelineRepository.save(pipeline);
  }

  async findAllPipelines(tenantId: string): Promise<Pipeline[]> {
    return this.pipelineRepository.find({
      where: { tenantId },
      relations: ['stages'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOnePipeline(id: string, tenantId: string): Promise<Pipeline> {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
      relations: ['stages', 'stages.deals', 'stages.deals.contact'],
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    return pipeline;
  }

  async createStage(
    tenantId: string,
    pipelineId: string,
    data: Partial<Stage>,
  ): Promise<Stage> {
    await this.findOnePipeline(pipelineId, tenantId);
    const stage = this.stageRepository.create({ ...data, pipelineId });
    return this.stageRepository.save(stage);
  }

  async updateStage(
    id: string,
    tenantId: string,
    data: Partial<Stage>,
  ): Promise<Stage> {
    const stage = await this.stageRepository.findOne({
      where: { id },
      relations: ['pipeline'],
    });
    if (!stage || stage.pipeline.tenantId !== tenantId) {
      throw new NotFoundException('Estágio não encontrado');
    }
    await this.stageRepository.update(id, data);
    const updatedStage = await this.stageRepository.findOne({ where: { id } });
    if (!updatedStage) throw new NotFoundException('Estágio não encontrado');
    return updatedStage;
  }

  async removeStage(id: string, tenantId: string): Promise<void> {
    const stage = await this.stageRepository.findOne({
      where: { id },
      relations: ['pipeline'],
    });
    if (!stage || stage.pipeline.tenantId !== tenantId) {
      throw new NotFoundException('Estágio não encontrado');
    }
    await this.stageRepository.delete(id);
  }

  async createDeal(tenantId: string, data: Partial<Deal>): Promise<Deal> {
    const deal = this.dealRepository.create({ ...data, tenantId });
    return this.dealRepository.save(deal);
  }

  async findAllDeals(tenantId: string, pipelineId?: string): Promise<Deal[]> {
    const query = this.dealRepository
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.stage', 'stage')
      .leftJoinAndSelect('deal.contact', 'contact')
      .leftJoinAndSelect('deal.assignedTo', 'assignedTo')
      .where('deal.tenantId = :tenantId', { tenantId });

    if (pipelineId) {
      query.andWhere('stage.pipelineId = :pipelineId', { pipelineId });
    }

    return query.orderBy('deal.createdAt', 'DESC').getMany();
  }

  async findOneDeal(id: string, tenantId: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      relations: ['stage', 'contact', 'assignedTo'],
    });
    if (!deal) throw new NotFoundException('Deal não encontrado');
    return deal;
  }

  async updateDeal(
    id: string,
    tenantId: string,
    data: Partial<Deal>,
  ): Promise<Deal> {
    await this.findOneDeal(id, tenantId);
    await this.dealRepository.update({ id, tenantId }, data);
    return this.findOneDeal(id, tenantId);
  }

  async removeDeal(id: string, tenantId: string): Promise<void> {
    await this.findOneDeal(id, tenantId);
    await this.dealRepository.delete({ id, tenantId });
  }
}
