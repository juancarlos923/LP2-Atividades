import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { celebrate, Joi, errors, Segments } from 'celebrate';
import multer from 'multer';

import uploadConfig from './config/multer.js';
import User from './models/User.js';

import { isAuthenticated } from './middleware/auth.js';
import SendMail from './services/SendMail.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const router = Router();

router.get('/', isAuthenticated, async (req, res) => {
  res.redirect('/index.html')
});


router.post(
  '/users',
  multer(uploadConfig).single('image'),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().required(),
      nome: Joi.string().email(),
      senha: Joi.string().min(8),
    }),
  }),
  async (req, res) => {
    try {
      const user = req.body;
      const imagem = req.file
      ? `/imgs/user/${req.file.filename}`
      : '/imgs/user/user.png';

      const newUser = await User.create(user,imagem);
      
      await User.createNewUser(user.email, newUser);

      res.json(newUser);
    } catch (error) {
      if (
        error.message.includes(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email'
        )
      ) {
        throw new AppError('Email already exists');
      } else {
        throw new AppError('Error in create user');
      }
    }
  }
);

router.get('/token/:id', async (req, res) => {
  try {
    const token = req.params.id
    
    const result = await User.token_verificado_email(token);
    
    if(result){
      res.redirect('/verificado.html')
    } else {
      res.redirect('/')
    }
  } catch (error) {
    throw new AppError('Error in verificar token');
  }
});

router.post('/imagem', async (req, res) => {
  try {
    jwt.verify(req.body.token, process.env.SECRET, async (err, decoded) => {
      if (err) {
        res.json({ error: 'Token inválido' });
      } else {

        const result = await User.consultar_imagem(decoded.id_empresario);
        
        res.send(result);
      }
    });
  } catch (error) {
    throw new AppError('Error in verificar token');
  }
});

router.post('/signin', async (req, res) => {
  
  try {
    const { email, password } = req.body;
    
    const user = await User.readByEmail(email);

    if (!user) {
      throw new AppError('User not found');
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

      throw new AppError('User not found');
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

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
  } else {
    res.status(500).json({ message: 'Something broke!' });
  }
});

export default router;
