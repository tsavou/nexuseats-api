import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const createContext = (user?: { role?: string | string[] }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('returns true when no @Roles metadata is defined', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext({ role: 'customer' }))).toBe(true);
  });

  it('returns true when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner', 'admin']);

    expect(guard.canActivate(createContext({ role: 'owner' }))).toBe(true);
  });

  it('throws ForbiddenException when the user role is insufficient', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    expect(() =>
      guard.canActivate(createContext({ role: 'customer' })),
    ).toThrow(ForbiddenException);
  });
});
