import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const createContext = () =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  it('returns true immediately on a @Public route', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('delegates to passport AuthGuard on protected routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const parentSpy = jest
      .spyOn(parentPrototype, 'canActivate')
      .mockResolvedValue(true as never);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(parentSpy).toHaveBeenCalled();
    parentSpy.mockRestore();
  });

  it('throws UnauthorizedException when passport returns no user', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('rethrows the underlying auth error when passport fails', () => {
    const error = new UnauthorizedException('jwt expired');

    expect(() => guard.handleRequest(error, null)).toThrow(error);
  });
});
