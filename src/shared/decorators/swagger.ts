import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';

import { ClientError, ServerError } from '../errors/error.entity';
import { PaginationDto } from '../helpers/pagination/pagination.dto';

type swaggerProps = {
  tags: string[];
  summary: string;
  description?: string;
  okResponse?: any;
  createdResponse?: any;
  applyOkPaginatedResponse?: boolean;
  applyBadRequest?: boolean;
  applyConflict?: boolean;
  applyNotFound?: boolean;
  applyUnsupportedMediaType?: boolean;
}

export function Swagger(props: swaggerProps) {
  return applyDecorators(
    ApiTags(...props.tags),
    ApiOperation({ summary: props.summary, description: props.description }),

    applyOkResponse(props.okResponse),
    applyOkPaginatedResponse(props.applyOkPaginatedResponse),
    applyCreatedResponse(props.createdResponse),
    applyBadRequestResponse(props.applyBadRequest),
    applyNotFoundResponse(props.applyNotFound),
    applyConflictResponse(props.applyConflict),
    applyUnsupportedMediaTypeResponse(props.applyUnsupportedMediaType),

    ApiInternalServerErrorResponse({ type: ServerError, description: 'Internal Server Error' }),
  );
}

function applyOkResponse(type?: any) {
  return type ? ApiOkResponse({ type, description: 'OK' }) : () => {};
}

function applyOkPaginatedResponse(apply?: boolean) {
  return apply ? ApiAcceptedResponse({ type: PaginationDto, description: 'Paginação. O objeto dentro de \'data\' é o mesmo objeto de cima ↑↑' }) : () => {};
};

function applyCreatedResponse(type?: any) {
  return type ? ApiCreatedResponse({ type, description: 'Created' }) : () => {};
}

function applyBadRequestResponse(apply?: boolean) {
  return apply ? ApiBadRequestResponse({ type: ClientError, description: 'Bad Request' }) : () => {};
}

function applyNotFoundResponse(apply?: boolean) {
  return apply ? ApiNotFoundResponse({ type: ServerError, description: 'Not Found' }) : () => {};
}

function applyConflictResponse(apply?: boolean) {
  return apply ? ApiConflictResponse({ type: ServerError, description: 'Conflict' }) : () => {};
}

function applyUnsupportedMediaTypeResponse(apply?: boolean) {
  return apply ? ApiUnsupportedMediaTypeResponse({ type: ServerError, description: 'Unsupported Media Type' }) : () => {};
}
