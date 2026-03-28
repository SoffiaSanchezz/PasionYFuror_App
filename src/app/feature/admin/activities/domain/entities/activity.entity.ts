export interface ActivityEntity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime: string;
  imagePath?: string;
  invitedEmails: string[];
  createdAt: string;
  updatedAt: string;
}
