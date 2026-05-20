import { AppDataSource } from '../config/database';
import { Vendor, VendorCategory, VendorStatus } from '../entities/Vendor';
import { VendorRating } from '../entities/VendorRating';
import { CreateVendorDto, UpdateVendorDto, CreateVendorRatingDto } from '../dto/vendor.dto';
import { AppError } from '../middleware/errorHandler';

const vendorRepo = AppDataSource.getRepository(Vendor);
const ratingRepo = AppDataSource.getRepository(VendorRating);

function generateVendorCode(name: string): string {
  const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, '');
  return `VND-${prefix}-${Date.now().toString().slice(-4)}`;
}

export class VendorService {
  async getAll(page = 1, limit = 20, search?: string, category?: VendorCategory, status?: VendorStatus) {
    const query = vendorRepo.createQueryBuilder('v');
    if (search) {
      query.where('(LOWER(v.name) LIKE :s OR LOWER(v.code) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    if (category) query.andWhere('v.category = :category', { category });
    if (status) query.andWhere('v.status = :status', { status });

    return query
      .orderBy('v.performanceScore', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async getById(id: string) {
    const vendor = await vendorRepo.findOne({
      where: { id },
      relations: ['ratings'],
    });
    if (!vendor) throw new AppError('Vendor not found', 404);
    return vendor;
  }

  async create(dto: CreateVendorDto, createdBy: string) {
    const code = generateVendorCode(dto.name);
    const vendor = vendorRepo.create({ ...dto, code, createdBy });
    return vendorRepo.save(vendor);
  }

  async update(id: string, dto: UpdateVendorDto) {
    const vendor = await vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new AppError('Vendor not found', 404);
    if (dto.status === VendorStatus.BLACKLISTED && vendor.status !== VendorStatus.BLACKLISTED) {
      vendor.performanceScore = '0';
    }
    Object.assign(vendor, dto);
    return vendorRepo.save(vendor);
  }

  async delete(id: string) {
    const vendor = await vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new AppError('Vendor not found', 404);
    vendor.status = VendorStatus.INACTIVE;
    return vendorRepo.save(vendor);
  }

  async addRating(vendorId: string, dto: CreateVendorRatingDto, ratedBy: string) {
    const vendor = await vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new AppError('Vendor not found', 404);

    const overall = ((dto.qualityScore + dto.deliveryScore + dto.pricingScore) / 3) * 20;
    const rating = ratingRepo.create({
      vendorId,
      qualityScore: dto.qualityScore,
      deliveryScore: dto.deliveryScore,
      pricingScore: dto.pricingScore,
      overallScore: String(Math.round(overall * 100) / 100),
      comments: dto.comments ?? null,
      projectId: dto.projectId ?? null,
      ratedBy,
    });
    await ratingRepo.save(rating);

    const allRatings = await ratingRepo.find({ where: { vendorId } });
    const avgScore =
      allRatings.reduce((s, r) => s + parseFloat(r.overallScore), 0) / allRatings.length;
    vendor.performanceScore = String(Math.round(avgScore * 100) / 100);
    await vendorRepo.save(vendor);

    return rating;
  }

  async getTopVendors(category?: VendorCategory, limit = 10) {
    const query = vendorRepo
      .createQueryBuilder('v')
      .where('v.status = :status', { status: VendorStatus.ACTIVE })
      .andWhere('CAST(v.performanceScore AS DECIMAL) > 0');

    if (category) query.andWhere('v.category = :category', { category });

    return query
      .orderBy('CAST(v.performanceScore AS DECIMAL)', 'DESC')
      .take(limit)
      .getMany();
  }
}

export const vendorService = new VendorService();
