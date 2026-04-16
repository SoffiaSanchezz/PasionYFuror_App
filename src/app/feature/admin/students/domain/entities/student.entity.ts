// src/app/feature/admin/students/domain/entities/student.entity.ts
export interface StudentEntity {
  id: string;
  fullName: string;
  documentId: string;
  dateOfBirth: string; // ISO format date string
  email?: string | null;
  phone: string;
  address: string;
  photoPath?: string | null;
  signaturePath?: string | null;
  isMinor: boolean;
  guardianFullName?: string | null;
  guardianDocumentId?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
  guardianEmail?: string | null;
  faceDescriptor?: string | null;
  allowedAllClasses?: boolean;
  allowedScheduleIds?: string[];
  createdAt: string; // ISO format date string
  status: 'activo' | 'inactivo';
}
