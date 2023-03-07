import { createRoot } from "react-dom/client";

function App() {
  return <div>Hello, I am react</div>;
}
createRoot(document.getElementById("app")!).render(<App />);
