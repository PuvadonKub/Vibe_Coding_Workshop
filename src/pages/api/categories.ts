import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: true,
        },
      });
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      const category = await prisma.category.create({
        data: {
          name,
          description,
        },
      });
      return res.status(201).json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
