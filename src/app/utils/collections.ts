
export class Stack<T> {
  private _data;

  constructor(data?: T[]) {
    this._data = data ?? [];
  }

  public isEmpty(): boolean {
    return this._data.length === 0;
  }

  pop(): T | undefined {
    return this._data.pop();
  }

  push(item: T): void {
    this._data.push(item);
  }

}
