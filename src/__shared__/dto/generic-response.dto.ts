export class GenericResponse<T = any> {
  message?: string;
  payload?: T;
  constructor(message?: string, payload?: T) {
    this.message = message || "Success";
    this.payload = payload || null;
  }
}
