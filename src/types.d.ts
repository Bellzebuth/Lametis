export type Role = "admin" | "manager" | "reader";

export type User = {
  id: string;
  name: string;
  role: Role;
};

export type TokenPayload = {
  id: string;
  name: string;
  role: Role;
};
