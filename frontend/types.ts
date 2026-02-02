export interface User {
  id: string;
  username: string;
  avatar: string;
  banner?: string;
  subscribers: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  parentId?: string | null;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  views: number;
  uploadedAt: string;
  duration: string;
  uploader: User;
  tags: string[];
}

export enum StreamStatus {
  OFFLINE = 'OFFLINE',
  LIVE = 'LIVE',
  loading = 'LOADING'
}