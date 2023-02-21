export function view() {
  console.log("hello server");

  return function client() {
    console.log("hello client");
  };
}
