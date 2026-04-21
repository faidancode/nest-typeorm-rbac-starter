import type { Request } from 'express';
import type { AppAbility } from './casl-ability.factory';

export interface RequestWithAbility extends Request {
  ability?: AppAbility;
}
