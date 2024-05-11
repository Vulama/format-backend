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

router.post('/formula/react', authenticateToken, async (req, res) => {
  try {
    const user = req.user

    if(!user){
      return res.status(403).json({ error: 'This user is not allowed to use this endpoint' });
    }

    const { formulaId, responseType } = req.body;

    if (!formulaId || !responseType) {
      return res.status(400).json({ error: 'Formula ID and response type are required' });
    }

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        formulaId: formulaId,
        formula: {
          group: {
            ownerId: user.id
          }
        },
        responseType: responseType
      }
    });

    if (existingReaction) {
      return res.status(400).json({ error: 'User has already reacted with the same type' });
    }

    const previousReaction = await prisma.reaction.findFirst({
      where: {
        formulaId: formulaId,
        formula: {
          group: {
            ownerId: user.id
          }
        }
      }
    });

    if (previousReaction) {
      await prisma.reaction.delete({
        where: {
          id: previousReaction.id
        }
      });
    }

    const reaction = await prisma.reaction.create({
      data: {
        formulaId,
        responseType
      }
    });

    res.status(201).json({ message: 'Reaction added successfully', reaction });
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

router.post('/groups/addFormula', authenticateToken, checkGroupOwnership, async (req, res) => {
  const { groupId, title, mathFormula, description } = req.body;

  try {a
    const newFormula = await prisma.formula.create({
      data: {
        groupId: Number(groupId),
        title,
        mathFormula,
        description,
      },
    });

    const group = await prisma.formulaGroup.update({
      where: { id: Number(groupId) },
      data: {
        formulas: {
          connect: { id: newFormula.id },
        },
      },
      include: {
        formulas: true,
      },
    });

    res.status(200).json(group);
  } catch (error) {
    console.error('Error adding formula to group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/groups/deleteFormula', authenticateToken, checkGroupOwnership, async (req, res) => {
  const { groupId, formulaId } = req.body;

  try {
    await prisma.formula.delete({
      where: {
        id: Number(formulaId),
      },
    });

    const updatedGroup = await prisma.formulaGroup.findUnique({
      where: {
        id: Number(groupId),
      },
      include: {
        formulas: true,
      },
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('Error deleting formula from group:', error);
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
