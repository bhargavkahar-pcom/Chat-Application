import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    primary: {
      main: "#6366f1",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

export default darkTheme;
