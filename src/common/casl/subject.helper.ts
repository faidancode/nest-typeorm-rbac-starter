import type { SubjectObject } from './subjects';

export function subject<T extends object>(type: string, object: T): T & SubjectObject {
  return {
    ...object,
    __type: type,
  };
}
