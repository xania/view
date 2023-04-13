interface TitleProps {
  children: string;
}
export function Title(props: TitleProps) {
  return (
    <h1 class="mt-0 mb-2 text-5xl font-medium leading-tight text-primary text-gray-500">
      {props.children}
    </h1>
  );
}
