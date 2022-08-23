import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from './models/User.js';

import { isAuthenticated } from './middleware/auth.js';

const router = Router();

router.get('/', isAuthenticated, async (req, res) => {
  res.redirect('/index.html')
});


router.post('/users', async (req, res) => {
  try {
    const user = req.body;

    const newUser = await User.create(user);

    res.json(newUser);
  } catch (error) {
    throw new Error('Error in create user');
  }
});

router.post('/signin', async (req, res) => {
  
  try {
    const { email, password } = req.body;

    const user = await User.readByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }
    const { id_empresario, senha } = user;

    const match = await bcrypt.compareSync(password, senha);
    
    if (match) {
      const token = jwt.sign(
        { id_empresario },
        process.env.SECRET,
        { expiresIn: 3600 } // 1h
      );
      
      res.json({ auth: true, token });
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(401).json({ error: 'User not found' });
  }
});

router.use(function (req, res, next) {
  res.status(404).json({
    message: 'Content not found',
  });
});

router.use(function (error, req, res, next) {
  console.error(error.stack);

  res.status(500).json({
    message: 'Something broke!',
  });
});

export default router;
