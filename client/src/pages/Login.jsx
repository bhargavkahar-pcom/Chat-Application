import { useState } from "react";
import { TextField, Button, Paper } from "@mui/material";
import axios from "../api/axios";

export default function Login({ setAuth }) {
  const [username, setUsername] = useState("");

  const login = async () => {
    const res = await axios.post("/auth/login", { username });

    localStorage.setItem("auth", JSON.stringify(res.data));
    setAuth(res.data);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Paper className="p-8 w-96 bg-slate-800">
        <h2 className="text-xl mb-4">Enter Username</h2>
        <TextField
          fullWidth
          label="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button fullWidth className="mt-4" variant="contained" onClick={login}>
          Join
        </Button>
      </Paper>
    </div>
  );
}
