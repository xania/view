import { Attrs } from "xania/headless";

interface TitleProps {
  children: string;
}
export function Title(props: TitleProps) {
  return (
    <>
      <Attrs class="flex flex-col" />

      <span class="mt-0 mb-2 font-bold text-m uppercase text-gray-400 leading-tight text-primary justify-center align-middle inline-flex whitespace-nowrap">
        {props.children}
      </span>
    </>
  );
}
