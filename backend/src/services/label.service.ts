import { prisma } from '../utils/prisma';

export class LabelService {
  static async getLabels(projectId: string) {
    return prisma.label.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  static async createLabel(projectId: string, name: string, color: string) {
    const existing = await prisma.label.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      throw new Error('A label with this name already exists in the project.');
    }

    return prisma.label.create({
      data: {
        projectId,
        name: name.trim(),
        color,
      },
    });
  }

  static async deleteLabel(labelId: string) {
    return prisma.label.delete({
      where: { id: labelId },
    });
  }
}
