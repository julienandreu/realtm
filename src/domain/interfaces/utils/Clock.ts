export interface Clock {
  now(): Date;
}

export const Clock = Symbol('Clock');
