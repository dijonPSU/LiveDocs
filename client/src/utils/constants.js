export const dataActionEnum = {
  JOIN: "join",
  LEAVE: "leave",
  SEND: "send",
  CLIENTLIST: "clientList",
  NOTIFICATION: "notification",
  CURSOR: "cursor",
};

export const saveStatusEnum = {
  SAVING: "Saving...",
  SAVED: "All changes saved",
  ERROR: "Failed to save",
};

export const documentRolesEnum = {
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
  ADMIN: "ADMIN",
};

export const httpMethod = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PATCH: "PATCH",
};

export const httpHeaders = { "Content-Type": "application/json" };

export const baseURL = "http://localhost:3000";
