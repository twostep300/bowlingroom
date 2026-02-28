export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'EDITOR';
};
