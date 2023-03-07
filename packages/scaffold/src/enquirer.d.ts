declare module "enquirer" {
  const multiselect: MultiSelect;
  const select: Select;
}

interface Choice<TKey> {
  name: TKey;
  message?: string;
  value?: string;
  hint?: string;
  disabled?: boolean | string;
}

type MultiSelect = <TKey extends string, TChoice extends Choice<TKey>>(
  opts: SelectPromptOptions<TChoice>
) => Promise<TChoice["name"][]>;

type Select = <TKey extends string, TChoice extends Choice<TKey>>(
  opts: SelectPromptOptions<TChoice>
) => Promise<TChoice["name"]>;

interface SelectPromptOptions<TChoice> {
  name: string;
  message?: string;
  choices: TChoice[];
}
