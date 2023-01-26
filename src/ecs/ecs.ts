import { assertNonNull, NonNull } from '@/oidlib';
import { ECSUpdate, Ent, System } from '@/void';

export interface ECS<T, Update extends ECSUpdate = ECSUpdate> {
  factory: Ent;
  readonly systems: Set<System<T, Update>>;
  readonly entsBySystem: Map<System<T, Update>, Set<Ent>>; // process in order
  readonly componentsByRef: Map<T[keyof T], T>; // to-do: no
  readonly componentsByEnt: Map<Ent, Partial<T>>;
  readonly systemsByEnt: Map<Ent, Set<System<T, Update>>>;
  readonly pending: Command<T>[];
}

type Command<T> =
  | AddComponentsCommand<T>
  | AddEntCommand<T>
  | RemoveComponentsCommand<T>
  | RemoveEntCommand;

interface AddComponentsCommand<T> {
  readonly type: 'AddComponents';
  readonly ent: Ent;
  readonly components: T;
}

interface AddEntCommand<T> {
  readonly type: 'AddEnt';
  readonly components: T;
}

interface RemoveComponentsCommand<T> {
  readonly type: 'RemoveComponents';
  readonly ent: Ent;
  readonly components: ReadonlySet<keyof T>;
}

interface RemoveEntCommand {
  readonly type: 'RemoveEnt';
  readonly ent: Ent;
}

// Map a tuple of types to a tuple of optional components.
type TypeToComponentArray<T, Tuple> = Tuple extends [infer Type, ...infer Rest]
  ? Type extends keyof T ? [T[Type], ...TypeToComponentArray<T, Rest>]
  : never
  : [];

export function ECS<T, Update extends ECSUpdate = ECSUpdate>(
  systems: Set<System<T, Update>>,
): ECS<T> {
  return {
    factory: Ent(0),
    systems,
    entsBySystem: new Map([...systems].map((system) => [system, new Set()])),
    componentsByEnt: new Map(),
    componentsByRef: new Map(),
    systemsByEnt: new Map(),
    pending: [],
  };
}

export namespace ECS {
  export function addComponents<T>(
    self: ECS<T>,
    ent: Ent,
    components: T,
  ): void {
    self.pending.push({ type: 'AddComponents', ent, components });
  }

  export function addEnt<T>(
    self: ECS<T>,
    ...components: readonly T[] //[T, ...T[]]
  ): void {
    for (const map of components) {
      self.pending.push({ type: 'AddEnt', components: map });
    }
  }

  export function query<T>(self: ECS<T>, ...types: (keyof T)[]): T[] {
    const sets = [];
    for (const set of self.componentsByEnt.values()) {
      if (types.every((type) => type in set)) sets.push(<Required<T>> set);
    }
    return sets;
  }

  export function get<T, Type extends keyof T>(
    self: ECS<T>,
    ent: Ent,
    type: Type,
  ): NonNullable<T[Type]>;
  export function get<T, Types extends readonly (keyof T)[]>(
    self: ECS<T>,
    ent: Ent,
    ...types: Types
  ): TypeToComponentArray<T, Types>;
  export function get<T, Types extends readonly (keyof T)[]>(
    self: ECS<T>,
    ent: Ent,
    ...types: Types
  ): NonNullable<T[Types[0]]> | TypeToComponentArray<T, Types> {
    const components = [];
    for (const type of types) {
      const component = self.componentsByEnt.get(ent)?.[type];
      assertNonNull(component, `Ent ${ent} missing ${String(type)} component.`);
      components.push(component);
    }
    return types.length == 1
      ? components[0] as NonNullable<T[Types[0]]>
      : (components as TypeToComponentArray<T, Types>);
  }

  export function flush<T extends Record<never, never>>(self: ECS<T>): void {
    for (const cmd of self.pending) execCmd<T>(cmd, self);
    self.pending.length = 0;
  }

  export function removeEnt<T>(self: ECS<T>, ent: Ent): void {
    self.pending.push({ type: 'RemoveEnt', ent });
  }

  export function removeComponents<T>(
    self: ECS<T>,
    ent: Ent,
    components: ReadonlySet<keyof T>,
  ): void {
    self.pending.push({ type: 'RemoveComponents', ent, components });
  }

  export function update<
    T extends Record<never, never>,
    Update extends ECSUpdate,
  >(
    self: ECS<T>,
    update: Update,
  ): void {
    for (const [system, ents] of self.entsBySystem.entries()) {
      if (system.skip?.(update)) continue;
      const sets = new Set(
        [...ents].map((ent) => getEntComponents(self, ent)) as unknown as T[],
      );

      if (system.update != null) system.update(sets, update);
      else for (const set of sets) system.updateEnt?.(set, update);
    }
    flush(self);
  }
}

function execCmd<T extends Record<never, never>>(
  cmd: Command<T>,
  self: ECS<T>,
): void {
  switch (cmd.type) {
    case 'AddComponents': {
      addComponents(self, cmd.ent, cmd.components);
      break;
    }
    case 'AddEnt': {
      self.factory = Ent(self.factory + 1);
      const ent = self.factory;
      self.componentsByEnt.set(ent, {});
      self.systemsByEnt.set(ent, new Set());
      addComponents(self, ent, cmd.components);
      break;
    }
    case 'RemoveComponents':
      removeComponents(self, cmd.ent, cmd.components);
      break;
    case 'RemoveEnt': {
      self.componentsByEnt.delete(cmd.ent);
      const systems = getEntSystems(self, cmd.ent);
      self.systemsByEnt.delete(cmd.ent);
      for (const system of systems) {
        self.entsBySystem.get(system)?.delete(cmd.ent);
      }
      break;
    }
  }
}

// add or replace components.
function addComponents<T extends Record<never, never>>(
  self: ECS<T>,
  ent: Ent,
  components: T,
): void {
  const entComponents = getEntComponents(self, ent);
  if (entComponents == null) return;
  for (const [type, component] of Object.entries(components)) {
    self.componentsByRef.delete(entComponents[type as keyof T]!);
    entComponents[type as keyof T] = component as T[keyof T];
    self.componentsByRef.set(component as T[keyof T], entComponents as T);
  }
  invalidateEntSystems(self, ent);
}

function removeComponents<T>(
  self: ECS<T>,
  ent: Ent,
  components: ReadonlySet<keyof T>,
): void {
  const entComponents = getEntComponents(self, ent);
  for (const component of components) {
    const ref = entComponents[component];
    delete entComponents[component];
    self.componentsByRef.delete(ref!);
  }
  invalidateEntSystems(self, ent);
}

function getEntComponents<T>(self: ECS<T>, ent: Ent): Partial<T> {
  return NonNull(
    self.componentsByEnt.get(ent),
    `Ent ${ent} missing in ECS.componentsByEnt.`,
  );
}

function hasEntComponents<T>(
  self: ECS<T>,
  ent: Ent,
  query: ReadonlySet<keyof T>,
): boolean {
  const components = getEntComponents(self, ent);
  return [...query].every((type) => type in components);
}

function invalidateEntSystems<T>(self: ECS<T>, ent: Ent): void {
  const systems = new Set<System<T>>();
  for (const [system, ents] of self.entsBySystem) {
    const add = hasEntComponents(self, ent, system.query);
    ents[add ? 'add' : 'delete'](ent);
    if (add) systems.add(system);
  }
  const entSystems = getEntSystems(self, ent);
  entSystems.clear();
  for (const system of systems) entSystems.add(system);
}

function getEntSystems<T>(self: ECS<T>, ent: Ent): Set<System<T>> {
  return NonNull(
    self.systemsByEnt.get(ent),
    `Ent ${ent} missing in ECS.systemsByEnt.`,
  );
}
