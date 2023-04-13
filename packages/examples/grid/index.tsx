import { Grid, Column, DataSource } from "@xania/grid";
import gridcss from "./grid.module.scss";

function load(offset: number, size: number): DataSource<Person> {
  const data: Person[] = [];

  for (let i = offset; i < 10000 && i < size + offset; i++) {
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
    length: 10000,
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

  return (
    <>
      <h1 class="mt-0 mb-2 text-5xl font-medium leading-tight text-primary text-gray-300">
        Grid
      </h1>
      <div class="border-2 p-4">
        <table
          class={gridcss["grid"]}
          scroll={(e) =>
            grid.updateWindow(e.currentTarget.scrollTop, rowHeight)
          }
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
          <tbody
            style={grid.ds.map((ds) => `height: ${ds.length * rowHeight}px;`)}
          >
            <tr>
              <td
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
            <tr>
              <td
                style={grid.ds.map(
                  (x) =>
                    `padding-top: ${
                      (x.length - x.offset - x.data.length) * rowHeight
                    }px`
                )}
              >
                {}
              </td>
            </tr>
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
