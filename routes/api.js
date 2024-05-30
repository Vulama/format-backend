const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authToken');
const { checkGroupOwnership } = require('../middleware/checkOwnership');

const prisma = new PrismaClient();

router.post('/publishGroup', authenticateToken, async (req, res) => {
  const ownerId = req.user.id
  const { name, formulas } = req.body;
  const normalisedFormulas = removeNullFieldsFromList(formulas);


  try {
    const newGroup = await prisma.formulaGroup.create({
      data: {
        ownerId: ownerId,
        name: name,
        formulas: {
          create: normalisedFormulas,
        },
      },
      include: {
        formulas: true,
      },
    });

    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.formulaGroup.findMany({
      include: {
        formulas: true,
      },
    });
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error retrieving groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username,
        passwordHash: password,
      },
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/loadUserData', authenticateToken, async (req, res) => {
  const user = req.user

  try {
    const downloadedFormulaGroups = await prisma.downloadedFormulaGroup.findMany({
      where: {
        userId: user.id,
      },
      include: {
        formulaGroup: {
          include: {
            formulas: true,
          },
        },
      },
    });

    const userReactions = await prisma.reaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        formula: true,
      },
    });

    res.json({
      user: user,
      downloadedFormulaGroups: downloadedFormulaGroups,
      userReactions: userReactions,
    });
  } catch (error) {
    console.error('Error during loading user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/user/groupDownload', authenticateToken, async (req, res) => {
  const userId = req.user.id
  const { formulaGroupId } = req.body;

  if(!userId){
    return res.status(403).json({ error: 'This user is not allowed to use this endpoint' });
  }

  try {
    const newDownload = await prisma.downloadedFormulaGroup.create({
      data: {
        userId,
        formulaGroupId
      }
    });
    res.status(201).json(newDownload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the downloaded formula group.' });
  }
});

router.post('/user/groupDelete', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { formulaGroupId } = req.body;

  if (!userId) {
    return res.status(403).json({ error: 'This user is not allowed to use this endpoint' });
  }

  try {
    const deletedDownload = await prisma.downloadedFormulaGroup.delete({
      where: {
        userId_formulaGroupId: {
          userId,
          formulaGroupId
        }
      }
    });
    res.status(200).json(deletedDownload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the downloaded formula group.' });
  }
});

router.post('/formula/react', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(403).json({ error: 'This user is not allowed to use this endpoint' });
    }

    const { formulaId, responseType } = req.body;

    if (!formulaId || !responseType) {
      return res.status(400).json({ error: 'Formula ID and response type are required' });
    }

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        formulaId: formulaId,
        userId: user.id
      }
    });

    if (existingReaction) {
      const updatedReaction = await prisma.reaction.update({
        where: {
          id: existingReaction.id
        },
        data: {
          responseType: responseType
        }
      });

      return res.status(200).json({ message: 'Reaction updated successfully', reaction: updatedReaction });
    }

    const newReaction = await prisma.reaction.create({
      data: {
        formulaId: formulaId,
        responseType: responseType,
        userId: user.id
      }
    });

    res.status(201).json({ message: 'Reaction added successfully', reaction: newReaction });
  } catch (error) {
    console.error('Error adding reaction to formula:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reactions', authenticateToken, checkGroupOwnership, async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const reactions = await prisma.reaction.findMany({
      where: {
        formula: {
          groupId: groupId
        }
      }
    });

    res.status(200).json({ reactions });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function removeNullFields(obj) {
  for (const key in obj) {
    if (obj[key] === null) {
      delete obj[key];
    }
  }
  return obj;
}

function removeNullFieldsFromList(list) {
  return list.map(obj => removeNullFields(obj));
}

module.exports = router;
