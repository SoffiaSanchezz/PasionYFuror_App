export interface ScheduleEntity {
  id: string;
  name: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  day: string;
  status: 'activo' | 'inactivo';
}
