export type UndoAction = () => void

export class UndoStack {
  private stack: UndoAction[] = []

  push(action: UndoAction) {
    this.stack.push(action)
  }

  undo() {
    const action = this.stack.pop()
    if (action) action()
  }

  clear() {
    this.stack = []
  }

  get length() {
    return this.stack.length
  }
}

export const undoStack = new UndoStack()
