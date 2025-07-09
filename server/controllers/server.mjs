import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import initPassport from "../controllers/auth.js"; // ES import
import {
  createDocument,
  getDocuments,
  savePatch,
  getDocumentContent,
  updateSnapshot,
} from "./documents.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

initPassport();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("http://localhost:5173/Homepage");
  },
);

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // clear cookie by your session name
      res.json({ message: "Logged out successfully" });
    });
  });
});

// Authenicated routes

app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
});

app.get("/documents", getDocuments);
app.get("/documents/:id/content", getDocumentContent);
app.post("/documents", createDocument);
app.post("/documents/:id/patches", savePatch);
app.put("/documents/:id/snapshot", updateSnapshot);

app.get("/me", (req, res) => {
  res.json(req.user);
});

export default app;
