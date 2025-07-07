import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import initPassport from '../controllers/auth.js'; // ES import

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

initPassport();

app.use(session({
  secret: 'secret',
  resave:false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to homepage
    res.redirect('http://localhost:5173/Homepage');
  }
);

export default app;
