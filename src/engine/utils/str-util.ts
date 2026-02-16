// to-do: unit test.
export function capitalize<Str extends string>(str: Str): Capitalize<Str> {
  if (!str[0]) return str as Capitalize<Str>
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}` as Capitalize<Str>
}

export function uncapitalize<Str extends string>(str: Str): Uncapitalize<Str> {
  if (!str[0]) return str as Uncapitalize<Str>
  return `${str[0].toLocaleLowerCase()}${str.slice(1)}` as Uncapitalize<Str>
}
