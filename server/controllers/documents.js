import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();



export async function getDocuments(req, res) {
    prisma.document.findMany({
        where: {userId: req.user.id},
        orderBy: {updatedAt: 'desc'},
    })
    .then((documents) => res.json(documents))
    .catch((err) => {
        console.error(err);
        res.status(500).json({message: "Failed to get documents"});
    });
}
