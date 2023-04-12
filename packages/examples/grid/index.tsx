import { Grid, Column, DataSource } from "@xania/grid";

function load(offset: number, size: number): DataSource<Person> {
  const data: Person[] = [];

  for (let i = 0; i < size; i++) {
    data.push({
      firstName: "p-" + (i + offset),
      lastName: "s",
      age: i,
      visits: offset,
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
    new Column({
      field: "visits",
    }),
    new Column({
      field: "status",
    }),
    new Column({
      field: "progress",
    }),
  ]);

  return (
    <>
      <h1 class="mt-0 mb-2 text-5xl font-medium leading-tight text-primary text-gray-300">
        Grid
      </h1>
      <div class="p-4">
        <table>
          <thead>
            <tr>
              <grid.Header>
                {(column) => <td class="text-gray-400">{column.title}</td>}
              </grid.Header>
            </tr>
          </thead>
          <tbody>
            <grid.Row>
              {(row, dispose) => (
                <tr>
                  <grid.Cell>
                    {(column) => <td>{row.prop(column.field)}</td>}
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
