import { prisma } from "./prisma"
import express from "express"
import { hash } from "bcrypt"
import nodemailer from 'nodemailer';

const app = express()
app.use(express.json())

const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "mailtrap.user",
    pass: "mailtrap.password"
  }
})

app.get('/', (request, response) => {
  return response.json({ message: 'Hello, World' })
})

app.post('/api/v1/users', async (request, response) => {
  const { username, email, password } = request.body

  const hashPassword = await hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashPassword
    }
  })

  await transport.sendMail({
    from: 'Equipe do Álvaro <commercial@alvarosena.com.br>',
    to: `<${email}>`,
    subject: 'Email verfication',
    html: [
      `<div style="font-family: sans-serif; font-size: 16px"; color: #111;>`,
      `<p>Please, confirm your email here</p>`, 
      `<p><a style="padding: 1rem; color: #fff background: #143F6B; text-decoration: none;" href="localhost:3001/api/v1/users/verification/${user.id}">CONFIRM</a</p>`,
      `</div>`,
    ].join('\n')
  })

  return response.json(user)
})

app.get('/api/v1/users/verification/:id', async (request, response) => {
  try {
    const { id } = request.params

    const user = await prisma.user.findUnique({
      where: {
        id
      }
    })
  
    if (!user) {
      throw new Error('User not found.')
    }

    if(user.confirimed === true) {
      return response.json('Account was verified.')
    }
  
    const confirmed = await prisma.user.update({
      where: {
        id
      },
      data: {
        confirimed: true
      }
    })
  
    return response.json({ message: `${user.username}, your account was confirmed successfully!` })
  }
  catch (error) {
    return response.status(400).json(error)
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Server running on http://localhost:${port}`))