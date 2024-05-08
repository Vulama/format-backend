const express = require('express')
const app = express()
const port = 3000
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


app.get('/', (req, res) => {
//   createDefaultUser()
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

async function createDefaultUser() {
    try {
      await prisma.user.create({
        data: {
          username: 'user',
          passwordHash: 'user123',
        },
      });
      console.log('Default user created successfully');
    } catch (error) {
      console.error('Error creating default user:', error);
    } finally {
      await prisma.$disconnect();
    }
  }