import { useState } from "react";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

function App() {
  const [auth, setAuth] = useState(JSON.parse(localStorage.getItem("auth")));

  return (
    <ThemeProvider theme={theme}>
      {auth ? (
        <Chat auth={auth} setAuth={setAuth} />
      ) : (
        <Login setAuth={setAuth} />
      )}
    </ThemeProvider>
  );
}

export default App;
