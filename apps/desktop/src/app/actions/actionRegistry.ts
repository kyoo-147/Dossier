export interface DossierKeyboardEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface DossierAction {
  id: string;
  label: string;
  shortcut?: string;
  confirm?: string;
  auditLabel?: string;
  disabled?: () => boolean;
  run(): void | Promise<void>;
}

export interface ActionRegistry {
  all(): DossierAction[];
  enabled(): DossierAction[];
  execute(id: string): Promise<void>;
  findByKeyboardEvent(event: DossierKeyboardEvent): DossierAction | undefined;
}

function normalizeShortcut(shortcut: string): string {
  return shortcut
    .split("+")
    .map((part) => {
      const token = part.trim();
      if (token.toLowerCase() === "ctrl") return "Ctrl";
      if (token.toLowerCase() === "cmd" || token.toLowerCase() === "meta") return "Meta";
      if (token.toLowerCase() === "alt") return "Alt";
      if (token.toLowerCase() === "shift") return "Shift";
      if (token.toLowerCase() === "enter") return "Enter";
      if (token.length === 1) return token.toUpperCase();
      return token;
    })
    .join("+");
}

function eventToShortcut(event: DossierKeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey && event.key.length > 1) parts.push("Shift");
  parts.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
  return parts.join("+");
}

function isEnabled(action: DossierAction): boolean {
  return !action.disabled?.();
}

export function formatShortcut(shortcut: string): string {
  return normalizeShortcut(shortcut);
}

export function createActionRegistry(actions: DossierAction[]): ActionRegistry {
  return {
    all() {
      return actions;
    },
    enabled() {
      return actions.filter(isEnabled);
    },
    async execute(id) {
      const action = actions.find((item) => item.id === id);
      if (!action) {
        throw new Error(`Action not found: ${id}`);
      }
      if (!isEnabled(action)) {
        throw new Error(`Action is disabled: ${id}`);
      }
      await action.run();
    },
    findByKeyboardEvent(event) {
      const shortcut = eventToShortcut(event);
      return actions.find((action) => action.shortcut && normalizeShortcut(action.shortcut) === shortcut && isEnabled(action));
    }
  };
}
