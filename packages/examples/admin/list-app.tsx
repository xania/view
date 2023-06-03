import { ForEach, useState } from "xania";

export function ListApp() {
  const list = useState([1, 2, 3]);

  const itemTemplate = <div>{123}</div>;

  return (
    <div>
      <ForEach source={list}>{itemTemplate}</ForEach>
    </div>
  );
}
