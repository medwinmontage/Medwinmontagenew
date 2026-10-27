import { prisma } from './prisma';

// Atomically increments a named counter and returns the new value, using
// Postgres's own atomicity (an UPDATE ... SET value = value + 1 executes as
// a single statement) rather than a read-then-write in application code,
// which would be vulnerable to two simultaneous bookings both reading "5"
// and both writing "6".
async function nextCounterValue(name: 'event' | 'service' | 'quote' | 'crew'): Promise<number> {
  const result = await prisma.counter.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  });
  return result.value;
}

export async function nextEventRef(): Promise<string> {
  const n = await nextCounterValue('event');
  return `MMBE-${String(n).padStart(3, '0')}`;
}

export async function nextServiceRef(): Promise<string> {
  const n = await nextCounterValue('service');
  return `MMBS-${String(n).padStart(3, '0')}`;
}

export async function nextQuoteRef(): Promise<string> {
  const n = await nextCounterValue('quote');
  return `MMBQ-${String(n).padStart(3, '0')}`;
}

export async function nextCrewRef(): Promise<string> {
  const n = await nextCounterValue('crew');
  return `MMCR-${String(n).padStart(3, '0')}`;
}
