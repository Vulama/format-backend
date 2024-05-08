const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authToken');
const { checkGroupOwnership } = require('../middleware/checkOwnership');

const prisma = new PrismaClient();

router.post('/addGroup', async (req, res) => {
  const { ownerId, name, formulas } = req.body;

  try {
    // Create the group
    const newGroup = await prisma.formulaGroup.create({
      data: {
        ownerId: ownerId,
        name: name,
        formulas: {
          create: formulas,
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

router.post('/groups/addFormula', authenticateToken, checkGroupOwnership, async (req, res) => {
  const { groupId, title, mathFormula, description } = req.body;

  try {
    // Create a new formula
    const newFormula = await prisma.formula.create({
      data: {
        groupId: Number(groupId),
        title,
        mathFormula,
        description,
      },
    });

    // Add the newly created formula to the group
    const group = await prisma.formulaGroup.update({
      where: { id: Number(groupId) },
      data: {
        formulas: {
          connect: { id: newFormula.id }, // Connect the new formula to the group
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

router.delete('/groups/deleteFormula', authenticateToken, checkGroupOwnership,async (req, res) => {
  const { groupId, formulaId } = req.body;

  try {
    // Delete the formula from the database
    await prisma.formula.delete({
      where: {
        id: Number(formulaId),
      },
    });

    // Fetch the updated group without the deleted formula
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

module.exports = router;
