'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import type { Car, Plan } from '@/lib/types';
import { updateCarWaypoints } from '@/store/actions/cars';
import { Dialog } from '../shared/Dialog';

type Props = {
  open: boolean;
  car: Car | null;
  plan: Plan;
  onClose: () => void;
};

export function WaypointsDialog({ open, car, plan, onClose }: Props) {
  const [locations, setLocations] = useState<string[]>(['']);

  useEffect(() => {
    if (!open || !car) return;
    const next = car.waypoints.length > 0 ? car.waypoints.map((waypoint) => waypoint.location) : [''];
    setLocations(next.slice(0, 3));
  }, [car, open]);

  const driver = car?.driverId ? plan.passengers.find((p) => p.id === car.driverId) ?? null : null;
  const title = car ? `${driver ? `${driver.name} 的車` : car.type}停靠站` : '停靠站';

  const setLocation = (index: number, value: string) => {
    setLocations((current) => current.map((location, i) => (i === index ? value : location)));
  };

  const addWaypoint = () => {
    setLocations((current) => (current.length >= 3 ? current : [...current, '']));
  };

  const removeWaypoint = (index: number) => {
    setLocations((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const onSave = () => {
    if (!car) return;
    updateCarWaypoints(car.id, locations);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="space-y-2">
          {locations.map((location, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-semibold text-sky-700">
                {['A', 'B', 'C'][index]}
              </span>
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={location}
                  onChange={(event) => setLocation(index, event.target.value)}
                  placeholder={index === 0 ? '例如：板橋車站' : '新增上車地點'}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <button
                type="button"
                onClick={() => removeWaypoint(index)}
                aria-label="刪除停靠站"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addWaypoint}
          disabled={locations.length >= 3}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus className="h-4 w-4" />
          新增停靠站
        </button>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700"
          >
            儲存
          </button>
        </div>
      </div>
    </Dialog>
  );
}
