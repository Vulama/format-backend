const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const checkGroupOwnership = async (req, res, next) => {
    const { groupId } = req.body;
    const userId = req.user.id;

    try {
        const group = await prisma.formulaGroup.findUnique({
            where: {
                id: Number(groupId),
            },
            select: {
                ownerId: true,
            },
        });

        if (!group || group.ownerId !== userId) {
            return res.status(403).json({ error: 'You are not the owner of this group' });
        }

        next();
    } catch (error) {
        console.error('Error checking group ownership:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { checkGroupOwnership };
