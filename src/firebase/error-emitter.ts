// A simple, generic event emitter for client-side use.
// This allows different parts of the application to communicate
// without having direct dependencies on each other.
class EventEmitter<T extends Record<string, any>> {
  private events: { [K in keyof T]?: ((data: T[K]) => void)[] } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter((l) => l !== listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    if (!this.events[event]) return;
    this.events[event]!.forEach((listener) => listener(data));
  }
}

interface AppEvents {
  'permission-error': Error;
}

// Create a singleton instance of the event emitter.
// This will be used to broadcast events throughout the application.
export const errorEmitter = new EventEmitter<AppEvents>();
