declare module "enquirer" {
  const multiselect: MultiSelect;
  const select: Select;
  const input: Input;
}

type Input = (opts: {
  message: string | (() => Promise<string>);
  default?: string;
  transformer?: (value: string, transformOpts: { isFinal: boolean }) => string;
  validate?: (value: string) => boolean | string;
}) => Promise<string>;

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
