import { AppAbility } from './casl-ability.factory';

export type PolicyHandler =
  | ((ability: AppAbility) => boolean)
  | {
      handle(ability: AppAbility): boolean;
    };
