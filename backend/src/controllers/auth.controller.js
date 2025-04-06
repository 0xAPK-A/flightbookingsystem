const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require('../../knex');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const os = require('os');

function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceName in networkInterfaces) {
    for (const net of networkInterfaces[interfaceName]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address; // Return the first non-internal IPv4 address
      }
    }
  }

  return 'localhost'; // Fallback if none found
}

const myLocalIP = getLocalIP();

// User Signup
// exports.signup = async (req, res) => {
//     const { name, email, password } = req.body;
//     try {
//         // Check if user exists
//         const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
//         if (userExists.rows.length > 0) {
//             return res.status(400).json({ error: "User already exists" });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const result = await pool.query(
//             "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
//             [name, email, hashedPassword]
//         );

//         // Generate JWT Token
//         const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//         res.status(201).json({ user: result.rows[0], token });
//     } catch (error) {
//         console.error("Signup error:", error);
//         res.status(500).json({ error: "Signup failed" });
//     }
// };

// User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Check if email is verified
        if (!user.is_verified) {
            return res.status(403).json({ error: "Email not verified. Please check your inbox." });
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({
            user: { id: user.id, name: user.name, email: user.email },
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

exports.getUser = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from JWT
        const user = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const existingUser = await knex('users').where({ email }).first();
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // 🔐 Generate email verification token with user data (not store in DB yet)
      const token = jwt.sign(
        { name, email, password: hashedPassword },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // 15 mins validity
      );
  
      // Send verification email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your email",
        html: `<p>Click <a href="https://${myLocalIP}:5001/api/auth/verify?token=${token}">here</a> to verify your email.</p>`
      };
  
      transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: "Verification email sent. Please verify to complete signup." });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
  
    if (!token) return res.status(400).json({ error: "Token missing" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { name, email, password } = decoded;
  
      // Check again if user already exists
      const userExists = await knex('users').where({ email }).first();
      if (userExists) {
        return res.status(400).json({ error: "User already exists or already verified." });
      }
  
      // Now insert the user
      await knex('users').insert({
        name,
        email,
        password,
        is_verified: true
      });
  
      return res.status(200).json({ message: "Email verified and user created successfully." });
  
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: "Invalid or expired token." });
    }
  };
  
exports.resendVerificationEmail = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Check if user is already in DB
        const existingUser = await knex('users').where({ email }).first();

        if (existingUser && existingUser.is_verified) {
            return res.status(400).json({ error: "User already verified. Please log in." });
        }

        if (existingUser && !existingUser.is_verified) {
            return res.status(400).json({ error: "Verification email already sent earlier." });
        }

        // 2. Hash password again
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create new verification token with info
        const token = jwt.sign(
            { name, email, password: hashedPassword },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // 4. Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email again",
            html: `<p>Click <a href="http://${myLocalIP}:3000/verify?token=${token}">here</a> to verify your email.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email sending failed:", error);
                return res.status(500).json({ error: "Failed to send verification email" });
            } else {
                console.log("Verification email re-sent:", info.response);
                return res.status(200).json({ message: "Verification email re-sent. Check your inbox." });
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error during resend" });
    }
};
