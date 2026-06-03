export type DndDescriptor =
  | { kind: 'passenger'; passengerId: string }              // draggable
  | { kind: 'passenger-target'; passengerId: string }       // droppable (item-on-passenger)
  | { kind: 'item'; itemId: string }                        // draggable
  | { kind: 'staging-passengers' }
  | { kind: 'staging-items' }
  | { kind: 'driver'; carId: string }
  | { kind: 'seat'; carId: string; seatIndex: number }
  | { kind: 'trunk'; carId: string };

export function buildDndId(desc: DndDescriptor): string {
  switch (desc.kind) {
    case 'passenger':
      return `passenger:${desc.passengerId}`;
    case 'passenger-target':
      return `passenger-target:${desc.passengerId}`;
    case 'item':
      return `item:${desc.itemId}`;
    case 'staging-passengers':
      return 'staging-passengers';
    case 'staging-items':
      return 'staging-items';
    case 'driver':
      return `car:${desc.carId}:driver`;
    case 'seat':
      return `car:${desc.carId}:seat:${desc.seatIndex}`;
    case 'trunk':
      return `car:${desc.carId}:trunk`;
  }
}

export function parseDndId(id: string): DndDescriptor | null {
  if (id === 'staging-passengers') return { kind: 'staging-passengers' };
  if (id === 'staging-items') return { kind: 'staging-items' };

  if (id.startsWith('passenger-target:')) {
    return {
      kind: 'passenger-target',
      passengerId: id.slice('passenger-target:'.length),
    };
  }
  if (id.startsWith('passenger:')) {
    return { kind: 'passenger', passengerId: id.slice('passenger:'.length) };
  }
  if (id.startsWith('item:')) {
    return { kind: 'item', itemId: id.slice('item:'.length) };
  }

  if (id.startsWith('car:')) {
    const rest = id.slice('car:'.length);
    const driverMatch = rest.match(/^(.+):driver$/);
    if (driverMatch) return { kind: 'driver', carId: driverMatch[1] };

    const trunkMatch = rest.match(/^(.+):trunk$/);
    if (trunkMatch) return { kind: 'trunk', carId: trunkMatch[1] };

    const seatMatch = rest.match(/^(.+):seat:(\d+)$/);
    if (seatMatch) {
      return {
        kind: 'seat',
        carId: seatMatch[1],
        seatIndex: Number(seatMatch[2]),
      };
    }
  }

  return null;
}
