import { Grid, Column, DataSource } from "@xania/grid";
import gridcss from "./grid.module.scss";
import { Title } from "../components/heading";

const dataLength = 500000;

function load(offset: number, size: number): DataSource<Person> {
  const data: Person[] = [];

  for (let i = offset; i < dataLength && i < size + offset; i++) {
    data.push({
      firstName: "p-" + i,
      lastName: "s",
      age: (i % 30) + 20,
      visits: (i % 10) + 5,
      status: "Married",
      progress: i,
    });
  }

  return {
    data,
    offset,
    length: dataLength,
  };
}

export function App() {
  const grid = new Grid<Person>(load, [
    new Column({
      field: "firstName",
    }),
    new Column({
      field: "lastName",
    }),
    new Column({
      field: "age",
    }),
  ]);

  const rowHeight = 40;
  const headerHeight = 48;

  return (
    <>
      <Title>Grid</Title>
      <div
        class="border-0 p-0 overflow-auto h-[30rem]"
        scroll={(e) => grid.updateWindow(e.currentTarget.scrollTop, rowHeight)}
      >
        <table
          class="block"
          style={grid.ds.map(
            (ds) => `height: ${ds.length * rowHeight + headerHeight}px;`
          )}
        >
          <thead class="sticky top-0 bg-white">
            <tr>
              <td></td>
              <grid.Header>
                {(column) => <td class="p-3">{column.title}</td>}
              </grid.Header>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                class="p-0"
                colSpan={5}
                style={grid.ds.map(
                  (x) => `padding-top: ${x.offset * rowHeight}px`
                )}
              ></td>
            </tr>
            <grid.Row>
              {(row, dispose) => (
                <tr class={gridcss["grid-row"]}>
                  <td class="px-3 bg-white">&gt;</td>
                  <grid.Cell>
                    {(column) => <td class="px-2">{row.prop(column.field)}</td>}
                  </grid.Cell>
                  <td>
                    <button click={dispose}>&times;</button>
                  </td>
                </tr>
              )}
            </grid.Row>
          </tbody>
        </table>
      </div>
    </>
  );
}

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};
