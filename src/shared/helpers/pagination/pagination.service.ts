import { Injectable } from '@nestjs/common';

@Injectable()
export class PaginationService {
  public execute([rows, count]: [any[], number], page: number, size: number) {
    return {
      data: rows,
      currentPage: page,
      itemsPerPage: size,
      totalItems: count,
      totalPages: Math.ceil(count / size),
    };
  }
}
