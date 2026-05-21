import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';
import { Deal } from './deal.entity';

@Entity('stages')
export class Stage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  color: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages)
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline;

  @Column()
  pipelineId: string;

  @OneToMany(() => Deal, (deal) => deal.stage)
  deals: Deal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
