import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authRoutes = {
    async login(email, password) {
        try {
          console.log('Login attempt:', { email, password });
    
          const user = await User.findOne({ email: email.trim().toLowerCase() }).exec();
          console.log('User found:', user);
    
          if (!user) {
            return { success: false, error: 'Invalid credentials. User not found.' };
          }
    
          // Compare the input password with the stored hash
          const isMatch = await bcrypt.compare(password, user.password);
          console.log('Input Password:', password);
          console.log('Stored Hashed Password:', user.password);
          console.log('Password comparison result:', isMatch);
    
          if (!isMatch) {
            return { success: false, error: 'Invalid credentials. Incorrect password.' };
          }
    
          const token = jwt.sign({ id: user._id, email: user.email }, 'secret', { expiresIn: '1h' });
    
          console.log('Login successful:', user.email);
          return { success: true, token };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'An error occurred during login.' };
        }
      },

  async register(username, email, password) {
    try {
      console.log("Registering user:", { username, email, password }); // Debugging log

      // Ensure the user doesn't already exist
      const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
      }).exec();
      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Hash the password if it's defined
      if (!password) throw new Error("Password is required");

      const hashedPassword = await bcrypt.hashSync(password, 10); // Ensure salt rounds are 10
      console.log("Stored Hashed Password:", hashedPassword); // Debugging log

      // Create a new user
      const user = new User({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      });

      await user.save();

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  },
};
