import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User';

export const UserRepository = AppDataSource.getRepository(User).extend({
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email: email.toLowerCase() } });
  },

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  },

  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  },

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    role?: UserRole,
    status?: UserStatus
  ): Promise<[User[], number]> {
    const query = this.createQueryBuilder('user');

    if (search) {
      query.where(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: `%${search.toLowerCase()}%` }
      );
    }

    if (role) query.andWhere('user.role = :role', { role });
    if (status) query.andWhere('user.status = :status', { status });

    return query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();
  },

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const query = this.createQueryBuilder('user').where('user.email = :email', {
      email: email.toLowerCase(),
    });
    if (excludeId) query.andWhere('user.id != :excludeId', { excludeId });
    return (await query.getCount()) > 0;
  },
});
