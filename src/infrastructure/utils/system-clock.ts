import { injectable } from 'tsyringe';
import { Clock } from '../../domain/interfaces/utils/Clock';

@injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
