import { Injectable } from '@nestjs/common';
import { PaginationDto } from './pagination.dto';

@Injectable()
export class PaginationService {
  public execute<T>([rows, count]: [T[], number], page: number, size: number): PaginationDto<T> {
    return {
      data: rows,
      currentPage: page,
      itemsPerPage: size,
      totalItems: count,
      totalPages: Math.ceil(count / size),
    };
  }
}
