import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PermissionRepository } from '../../role/repositories/permission.repository';
import { Action } from './action.enum';
import { subject } from './subject.helper';

describe('CaslAbilityFactoryTest', () => {
  let factory: CaslAbilityFactory;
  let permissionRepo: jest.Mocked<Pick<PermissionRepository, 'getUserPermissions'>>;

  beforeEach(async () => {
    permissionRepo = {
      getUserPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: PermissionRepository,
          useValue: permissionRepo,
        },
      ],
    }).compile();

    factory = module.get(CaslAbilityFactory);
  });

  it('should allow any subject when scope is all', async () => {
    permissionRepo.getUserPermissions.mockResolvedValue([
      { action: 'employee.read', scope: 'all' },
    ] as any);

    const ability = await factory.createForUser({
      id: 'user-1',
      departmentId: 'dept-1',
      teamId: 'team-1',
    });

    expect(ability.can(Action.Read, 'employee')).toBe(true);
  });

  it('should enforce department scope on matching objects', async () => {
    permissionRepo.getUserPermissions.mockResolvedValue([
      { action: 'employee.read', scope: 'department' },
    ] as any);

    const ability = await factory.createForUser({
      id: 'user-1',
      departmentId: 'dept-1',
      teamId: 'team-1',
    });

    expect(
      ability.can(
        Action.Read,
        subject('employee', { departmentId: 'dept-1' }),
      ),
    ).toBe(true);
    expect(
      ability.can(
        Action.Read,
        subject('employee', { departmentId: 'dept-2' }),
      ),
    ).toBe(false);
  });

  it('should enforce own scope on matching objects', async () => {
    permissionRepo.getUserPermissions.mockResolvedValue([
      { action: 'user.read', scope: 'own' },
    ] as any);

    const ability = await factory.createForUser({
      id: 'user-1',
      departmentId: 'dept-1',
      teamId: 'team-1',
    });

    expect(ability.can(Action.Read, subject('user', { id: 'user-1' }))).toBe(
      true,
    );
    expect(ability.can(Action.Read, subject('user', { id: 'user-2' }))).toBe(
      false,
    );
  });

  it('should enforce team scope when teamId is present', async () => {
    permissionRepo.getUserPermissions.mockResolvedValue([
      { action: 'employee.read', scope: 'team' },
    ] as any);

    const ability = await factory.createForUser({
      id: 'user-1',
      departmentId: 'dept-1',
      teamId: 'team-1',
    });

    expect(ability.can(Action.Read, subject('employee', { teamId: 'team-1' }))).toBe(
      true,
    );
    expect(ability.can(Action.Read, subject('employee', { teamId: 'team-2' }))).toBe(
      false,
    );
  });

  it('should ignore unknown scopes instead of granting broad access', async () => {
    permissionRepo.getUserPermissions.mockResolvedValue([
      { action: 'employee.read', scope: 'mystery' },
    ] as any);

    const ability = await factory.createForUser({
      id: 'user-1',
      departmentId: 'dept-1',
      teamId: 'team-1',
    });

    expect(ability.can(Action.Read, 'employee')).toBe(false);
  });
});
