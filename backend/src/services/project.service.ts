import { AppDataSource } from '../config/database';
import { Project, ProjectStatus } from '../entities/Project';
import { BudgetItem } from '../entities/BudgetItem';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const projectRepo = AppDataSource.getRepository(Project);
const budgetRepo = AppDataSource.getRepository(BudgetItem);

function generateProjectCode(): string {
  return `FB-${Date.now().toString().slice(-6)}`;
}

export class ProjectService {
  async getAll(page = 1, limit = 20, status?: ProjectStatus, search?: string) {
    const query = projectRepo.createQueryBuilder('p');
    if (status) query.where('p.status = :status', { status });
    if (search) {
      query.andWhere('(LOWER(p.name) LIKE :s OR LOWER(p.code) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    return query
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async getById(id: string) {
    const project = await projectRepo.findOne({
      where: { id },
      relations: ['budgetItems'],
    });
    if (!project) throw new AppError('Project not found', 404);

    const totalBudgeted = project.budgetItems.reduce(
      (sum, b) => sum + parseFloat(b.budgetedAmount), 0
    );
    const totalActual = project.budgetItems.reduce(
      (sum, b) => sum + parseFloat(b.actualAmount), 0
    );

    return {
      ...project,
      budgetSummary: {
        totalBudgeted,
        totalActual,
        variance: totalBudgeted - totalActual,
        utilizationPercent: totalBudgeted > 0
          ? Math.round((totalActual / totalBudgeted) * 100) : 0,
        itemCount: project.budgetItems.length,
        redItems: project.budgetItems.filter((b) => b.status === 'red').length,
        amberItems: project.budgetItems.filter((b) => b.status === 'amber').length,
      },
    };
  }

  async create(dto: CreateProjectDto, createdBy: string) {
    const project = projectRepo.create({
      ...dto,
      code: generateProjectCode(),
      createdBy,
    });
    return projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await projectRepo.findOne({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);
    Object.assign(project, dto);
    return projectRepo.save(project);
  }

  async delete(id: string) {
    const project = await projectRepo.findOne({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);
    if (project.status === ProjectStatus.ACTIVE)
      throw new AppError('Cannot delete an active project', 400);
    await projectRepo.remove(project);
  }

  async getDashboardStats() {
    const [active, planning, completed, onHold] = await Promise.all([
      projectRepo.count({ where: { status: ProjectStatus.ACTIVE } }),
      projectRepo.count({ where: { status: ProjectStatus.PLANNING } }),
      projectRepo.count({ where: { status: ProjectStatus.COMPLETED } }),
      projectRepo.count({ where: { status: ProjectStatus.ON_HOLD } }),
    ]);

    const budgetAgg = await budgetRepo
      .createQueryBuilder('b')
      .select('SUM(CAST(b.budgetedAmount AS DECIMAL))', 'totalBudgeted')
      .addSelect('SUM(CAST(b.actualAmount AS DECIMAL))', 'totalActual')
      .getRawOne();

    return {
      counts: { active, planning, completed, onHold, total: active + planning + completed + onHold },
      financials: {
        totalBudgeted: parseFloat(budgetAgg?.totalBudgeted || '0'),
        totalActual: parseFloat(budgetAgg?.totalActual || '0'),
      },
    };
  }
}

export const projectService = new ProjectService();
