import LogoutIcon from "@mui/icons-material/Logout";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Button,
  IconButton,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "../api/axios";

export default function Chat({ auth, setAuth }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [toast, setToast] = useState({ open: false, message: "" });

  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const messagesContentRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    messagesContentRef.current?.scrollIntoView();
  }, [messages]);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      auth: { token: auth.token },
    });

    const socket = socketRef.current;

    // Fetch users
    axios.get("/auth/users").then((res) => {
      setUsers(res.data.filter((u) => u._id !== auth.user._id));
    });

    // Online users
    socket.on("onlineUsers", (online) => {
      setUsers((prev) =>
        prev.map((u) => ({ ...u, isOnline: online.includes(u._id) })),
      );

      // 🔹 Live update for currently selected user
      setSelected((prev) => {
        if (!prev) return null;
        return { ...prev, isOnline: online.includes(prev._id) };
      });
    });

    // Typing indicator
    socket.on("typing", ({ senderId }) => {
      const currentSelected = selectedRef.current;

      if (currentSelected && senderId === currentSelected._id) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      const currentSelected = selectedRef.current;

      if (currentSelected && senderId === currentSelected._id) {
        setIsTyping(false);
      }
    });

    // Private messages
    socket.on("privateMessage", (msg) => {
      const currentSelected = selectedRef.current;

      if (
        currentSelected &&
        (msg.sender === currentSelected._id ||
          msg.receiver === currentSelected._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // 🔥 Listen for new user joining
    socket.on("userJoined", (user) => {
      setToast({ open: true, message: `${user.username} has joined!` });
      setUsers((prev) => {
        const exists = prev.find((u) => u._id === user._id);

        if (exists) {
          // Update existing user
          return prev.map((u) =>
            u._id === user._id ? { ...u, ...user, isOnline: true } : u,
          );
        } else {
          // Add new user
          return [...prev, { ...user, isOnline: true }];
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onSelectUser = async (user) => {
    setSelected(user);
    setIsTyping(false);

    const payload = {
      sender: auth.user._id,
      receiver: user._id,
    };

    await axios.post("/messages/user-messages", payload).then((res) => {
      setMessages(res.data.data);
    });
  };

  const onTypingMessage = async (message) => {
    if (!selected) return;

    setText(message);

    // if (selected._id === auth.user._id) setIsTyping(true);

    socketRef.current.emit("typing", {
      receiverId: selected._id,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit stopTyping after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", {
        receiverId: selected._id,
      });

      // if (selected._id === auth.user._id) setIsTyping(false);
    }, 5000);
  };

  const sendMessage = () => {
    if (!text.trim() || !selected) return;

    socketRef.current.emit("privateMessage", {
      receiverId: selected._id,
      content: text,
    });

    setText("");
  };

  const logout = async () => {
    localStorage.removeItem("auth");
    socketRef.current.disconnect();
    setAuth(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* HEADER */}
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar className="flex justify-between bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar className="bg-indigo-600">
              {auth.user.username.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Typography variant="h6">{auth.user.username}</Typography>
              <Typography variant="caption" className="text-green-400">
                ● Online
              </Typography>
            </div>
          </div>
          <IconButton onClick={logout} color="error">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-1/4 bg-slate-800 p-4 border-r border-slate-700 overflow-y-auto">
          <h3 className="mb-4 text-lg font-semibold">Users</h3>
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                onSelectUser(u);
              }}
              className={`p-3 rounded cursor-pointer flex items-center justify-between mb-2
                ${selected?._id === u._id ? "bg-indigo-600" : "hover:bg-slate-700"}
              `}
            >
              <span>{u.username}</span>
              <Badge variant="dot" color={u.isOnline ? "success" : "default"} />
            </div>
          ))}
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Chat Header */}
          {selected ? (
            <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
              <Typography variant="h6">
                Chat with {selected.username}
              </Typography>
              {!selected.isOnline && (
                <Typography variant="body2" className="text-red-400">
                  ● Offline
                </Typography>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Avatar className="bg-indigo-600 w-20 h-20 text-4xl animate-pulse">
                    💬
                  </Avatar>
                </div>
                <Typography variant="h6" className="mb-2">
                  Select a user to start chatting
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  Click on a user from the left panel to begin your private
                  conversation.
                </Typography>
              </div>
            </div>
          )}

          {/* Messages */}
          {selected && (
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 && !selected.isOnline && (
                <div className="text-center text-red-400 mt-10">
                  User is offline. You cannot send messages.
                </div>
              )}

              {/* {JSON.stringify(messages)} */}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.sender === auth.user._id ? "text-right" : "text-left"
                  }
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-lg m-1 
              ${m.sender === auth.user._id ? "bg-indigo-600" : "bg-slate-700"}
            `}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              <div ref={messagesContentRef} />
            </div>
          )}

          {isTyping && (
            <Typography
              variant="body2"
              className="text-green-400 animate-pulse"
            >
              {selected.username} is typing...
            </Typography>
          )}

          {/* Input */}
          {selected && (
            <div className="p-4 flex gap-2 bg-slate-800 border-t border-slate-700">
              <TextField
                fullWidth
                variant="outlined"
                value={text}
                onChange={(e) => onTypingMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // optional, prevents form submission
                    sendMessage();
                  }
                }}
                placeholder={
                  selected.isOnline
                    ? "Type a message..."
                    : "Cannot send messages. User is offline."
                }
                disabled={!selected.isOnline}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={!selected.isOnline}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 🔔 Snackbar for user joined */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="info" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
