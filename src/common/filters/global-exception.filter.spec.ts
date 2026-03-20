jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-request-id'),
}));

import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('maps Prisma P2002 errors to HTTP 409 responses', () => {
    const filter = new GlobalExceptionFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json };
    const request = {
      method: 'POST',
      url: '/restaurants',
      requestId: 'req-123',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    const exception = new Error('Unique constraint failed') as Error &
      Prisma.PrismaClientKnownRequestError;
    Object.setPrototypeOf(
      exception,
      Prisma.PrismaClientKnownRequestError.prototype,
    );
    Object.assign(exception, {
      code: 'P2002',
      meta: { target: ['name'] },
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Un enregistrement avec cette valeur de name existe déjà',
        path: '/restaurants',
        requestId: 'req-123',
      }),
    });
  });
});
